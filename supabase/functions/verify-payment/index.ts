import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const paymentVerificationSchema = z.object({
  sessionId: z.string().min(1).max(500),
  bookingId: z.string().uuid(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Authenticate user (optional for guest bookings, but verify ownership later)
    const authHeader = req.headers.get('Authorization');
    let user = null;
    
    if (authHeader) {
      const supabaseAuthClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );
      
      const { data: { user: authUser } } = await supabaseAuthClient.auth.getUser();
      user = authUser;
    }

    const body = await req.json();
    
    // Validate input
    const validationResult = paymentVerificationSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return new Response(JSON.stringify({ 
        error: 'Invalid request data'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    const { sessionId, bookingId } = validationResult.data;

    console.log('Verifying payment:', { sessionId, bookingId });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    console.log('Session status:', session.payment_status);

    // Update payment status
    const { error: paymentError } = await supabaseClient
      .from('payments')
      .update({
        status: session.payment_status === 'paid' ? 'succeeded' : 'failed',
        stripe_payment_intent_id: session.payment_intent as string,
        payment_method: session.payment_method_types?.[0]
      })
      .eq('stripe_session_id', sessionId);

    if (paymentError) {
      console.error('Payment update error:', paymentError);
    }

    // Get booking details and verify ownership
    const { data: booking } = await supabaseClient
      .from('bookings')
      .select('*, guests(*)')
      .eq('id', bookingId)
      .single();

    if (!booking) {
      throw new Error('Booking not found');
    }

    // SECURITY: Verify user owns this booking (guest bookings have null user_id)
    if (booking.user_id && user && booking.user_id !== user.id) {
      console.error('Unauthorized payment verification attempt');
      return new Response(JSON.stringify({ 
        error: 'Unauthorized' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Update booking status and process external booking if payment succeeded
    if (session.payment_status === 'paid') {
      // For flight bookings, create actual Amadeus booking
      if (booking.booking_type === 'flight' && booking.booking_data?.flight_offer) {
        try {
          console.log('Processing Amadeus flight booking...');
          
          const flightData = booking.booking_data;
          
          const amadeusBookingResult = await supabaseClient.functions.invoke('amadeus-book-flight', {
            body: {
              flightOffer: flightData.flight_offer,
              passengers: flightData.passengers,
              contactInfo: flightData.contact,
              baseCost: booking.base_cost,
              selectedSeats: flightData.selected_seats || [],
              selectedBaggage: flightData.selected_baggage || [],
              additionalFees: flightData.fees || { baggage: 0, seats: 0 },
              bookingId: bookingId // Pass booking ID to update instead of create
            }
          });
          
          if (amadeusBookingResult.error) {
            console.error('Amadeus booking error:', amadeusBookingResult.error);
            // Update booking with error status
            await supabaseClient
              .from('bookings')
              .update({
                status: 'cancelled',
                booking_data: {
                  ...booking.booking_data,
                  amadeus_error: amadeusBookingResult.error
                }
              })
              .eq('id', bookingId);
          } else {
            console.log('Amadeus booking successful');
            // Status will be updated by amadeus-book-flight function
          }
        } catch (flightError) {
          console.error('Failed to create Amadeus booking:', flightError);
          await supabaseClient
            .from('bookings')
            .update({
              status: 'cancelled'
            })
            .eq('id', bookingId);
        }
      }
      // For hotel bookings with Expedia data, create the actual Expedia booking
      else if (booking.booking_type === 'hotel' && booking.booking_data?.rooms) {
        try {
          console.log('Processing Expedia hotel booking...');
          
          // Get the selected room and rate from booking data
          const selectedRoom = booking.booking_data.rooms?.[0];
          const selectedRate = selectedRoom?.rates?.[0];
          const baseCost = selectedRate?.price || 0; // Expedia's actual cost
          
          if (selectedRoom && selectedRate && booking.booking_data.propertyInfo?.id) {
            const expediaBookingResult = await supabaseClient.functions.invoke('expedia-book-hotel', {
              body: {
                propertyId: booking.booking_data.propertyInfo.id,
                roomId: selectedRoom.id,
                rateId: selectedRate.id,
                checkIn: booking.booking_data.propertyInfo.checkIn,
                checkOut: booking.booking_data.propertyInfo.checkOut,
                guestInfo: {
                  email: booking.guests.email,
                  firstName: booking.guests.first_name,
                  lastName: booking.guests.last_name,
                  phone: booking.guests.phone,
                  specialRequests: booking.booking_data.specialRequests || ''
                },
                paymentToken: session.payment_intent as string,
                bookingReference: booking.booking_reference,
                baseCost: baseCost // Pass Expedia's actual cost
              }
            });
            
            // Calculate commission if booking succeeded
            if (!expediaBookingResult.error) {
              const customerPaid = booking.total_price;
              const markupAmount = customerPaid - baseCost;
              const stripeFee = (customerPaid * 0.029) + 0.30; // Stripe's standard fee
              const netProfit = markupAmount - stripeFee;
              
              // Update booking with commission details
              await supabaseClient
                .from('bookings')
                .update({
                  base_cost: baseCost,
                  markup_amount: markupAmount,
                  commission_earned: markupAmount,
                  stripe_fee: stripeFee,
                  net_profit: netProfit
                })
                .eq('id', bookingId);
            }

            if (expediaBookingResult.error) {
              console.error('Expedia booking error:', expediaBookingResult.error);
              // Update booking with error
              await supabaseClient
                .from('bookings')
                .update({
                  status: 'cancelled',
                  booking_data: {
                    ...booking.booking_data,
                    expedia_error: expediaBookingResult.error
                  }
                })
                .eq('id', bookingId);
            } else {
              console.log('Expedia booking successful:', expediaBookingResult.data);
            }
          }
        } catch (expediaError) {
          console.error('Failed to create Expedia booking:', expediaError);
          await supabaseClient
            .from('bookings')
            .update({
              status: 'cancelled'
            })
            .eq('id', bookingId);
        }
      } else {
        // For non-Expedia bookings, just mark as confirmed
        const { error: bookingError } = await supabaseClient
          .from('bookings')
          .update({
            status: 'confirmed'
          })
          .eq('id', bookingId);

        if (bookingError) {
          console.error('Booking update error:', bookingError);
        }
      }
    }

    // Get final updated booking
    const { data: finalBooking } = await supabaseClient
      .from('bookings')
      .select('*, guests(*)')
      .eq('id', bookingId)
      .single();

    // SECURITY: Filter sensitive guest data from response
    const sanitizedBooking = finalBooking ? {
      ...finalBooking,
      guests: finalBooking.guests ? {
        first_name: finalBooking.guests.first_name,
        last_name: finalBooking.guests.last_name,
        country: finalBooking.guests.country,
        // Exclude email, phone for security
      } : null
    } : null;

    return new Response(JSON.stringify({ 
      paymentStatus: session.payment_status,
      booking: sanitizedBooking
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('Error in verify-payment:', error);
    // SECURITY: Return generic error message, log details server-side only
    return new Response(JSON.stringify({ error: 'Payment verification failed. Please try again.' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
