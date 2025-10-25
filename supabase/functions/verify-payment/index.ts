import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema - bookingId is optional for AI chat bookings
const paymentVerificationSchema = z.object({
  sessionId: z.string().min(1).max(500),
  bookingId: z.string().uuid().optional(),
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

    // Check idempotency - prevent duplicate processing
    const { data: existingPayment } = await supabaseClient
      .from("processed_payments")
      .select("id, metadata")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();

    if (existingPayment) {
      console.log("Payment already processed:", sessionId);
      
      // Retrieve the booking that was created
      const bookingIdFromMetadata = existingPayment.metadata?.booking_data ? null : bookingId;
      if (bookingIdFromMetadata || existingPayment.metadata?.booking_id) {
        const { data: existingBooking } = await supabaseClient
          .from("bookings")
          .select("*, guests(*)")
          .eq("id", bookingIdFromMetadata || existingPayment.metadata.booking_id)
          .single();
        
        return new Response(JSON.stringify({ 
          paymentStatus: 'paid',
          booking: existingBooking,
          message: "Payment already processed" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      return new Response(JSON.stringify({ 
        paymentStatus: 'paid',
        message: "Payment already processed" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    console.log('Session status:', session.payment_status);

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ 
        paymentStatus: session.payment_status,
        message: "Payment not completed" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    let booking: any;
    let actualBookingId: string;

    // Two paths: Standard UI booking (has bookingId) or AI chat booking (no bookingId)
    if (bookingId) {
      // STANDARD UI BOOKING PATH
      console.log('Processing standard UI booking with bookingId:', bookingId);
      
      // Update payment status
      const { error: paymentError } = await supabaseClient
        .from('payments')
        .update({
          status: 'succeeded',
          stripe_payment_intent_id: session.payment_intent as string,
          payment_method: session.payment_method_types?.[0]
        })
        .eq('stripe_session_id', sessionId);

      if (paymentError) {
        console.error('Payment update error:', paymentError);
      }

      // Get booking details
      const { data: existingBooking } = await supabaseClient
        .from('bookings')
        .select('*, guests(*)')
        .eq('id', bookingId)
        .single();

      if (!existingBooking) {
        throw new Error('Booking not found');
      }

      booking = existingBooking;
      actualBookingId = bookingId;
    } else {
      // AI CHAT BOOKING PATH - Create booking from session metadata
      console.log('Processing AI chat booking without bookingId');
      
      const bookingData = JSON.parse(session.metadata.booking_data);
      const userId = session.metadata.user_id !== "guest" ? session.metadata.user_id : null;

      // Record payment as processed for idempotency
      await supabaseClient
        .from("processed_payments")
        .insert({
          payment_intent_id: session.payment_intent as string || sessionId,
          stripe_session_id: sessionId,
          user_id: userId,
          amount_cents: session.amount_total,
          currency: session.currency,
          payment_type: "booking",
          metadata: { booking_data: bookingData }
        });

      // Create booking record
      const { data: newBooking, error: bookingError } = await supabaseClient
        .from("bookings")
        .insert({
          user_id: userId,
          booking_type: bookingData.bookingType,
          booking_data: bookingData,
          total_price: session.amount_total / 100,
          currency: session.currency.toUpperCase(),
          status: "confirmed",
          booking_reference: `GS-${Date.now()}`,
        })
        .select('*, guests(*)')
        .single();

      if (bookingError) {
        console.error("Error creating booking:", bookingError);
        throw bookingError;
      }

      console.log("Booking created:", newBooking.id);
      booking = newBooking;
      actualBookingId = newBooking.id;

      // Update processed_payments with booking_id
      await supabaseClient
        .from("processed_payments")
        .update({ metadata: { booking_id: actualBookingId, booking_data: bookingData } })
        .eq("stripe_session_id", sessionId);
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

    // Process external booking APIs (Amadeus, Expedia)
    if (booking.status !== 'confirmed') { // Only process if not already confirmed
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
              bookingId: actualBookingId // Pass booking ID to update instead of create
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
              .eq('id', actualBookingId);
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
            .eq('id', actualBookingId);
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
                .eq('id', actualBookingId);
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
                .eq('id', actualBookingId);
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
            .eq('id', actualBookingId);
        }
      } else if (booking.booking_type === 'hotel' && booking.booking_data?.offers?.[0]) {
        // For Amadeus hotel bookings
        try {
          console.log('Processing Amadeus hotel booking...');
          
          const selectedOffer = booking.booking_data.offers[0];
          const hotelData = booking.booking_data.hotel || booking.booking_data;
          
          const amadeusBookingResult = await supabaseClient.functions.invoke('amadeus-book-hotel', {
            body: {
              offerId: selectedOffer.id,
              hotelId: hotelData.hotelId,
              guestInfo: {
                firstName: booking.guests?.first_name || 'Guest',
                lastName: booking.guests?.last_name || 'Guest',
                email: booking.guests?.email,
                phone: booking.guests?.phone
              },
              bookingReference: booking.booking_reference,
              baseCost: booking.base_cost || booking.total_price
            }
          });

          if (!amadeusBookingResult.error && amadeusBookingResult.data?.confirmationNumber) {
            console.log('✅ Amadeus booking successful, sending confirmation email...');
            
            // Send second confirmation email with Amadeus confirmation number
            const emailResult = await supabaseClient.functions.invoke('send-amadeus-confirmation-email', {
              body: {
                guestEmail: booking.guests?.email,
                guestName: `${booking.guests?.first_name || 'Guest'} ${booking.guests?.last_name || ''}`.trim(),
                bookingReference: booking.booking_reference,
                amadeusConfirmationNumber: amadeusBookingResult.data.confirmationNumber,
                bookingData: booking.booking_data,
                hotelName: hotelData.name || hotelData.hotelName || 'Hotel',
                hotelAddress: hotelData.address?.lines?.[0] || hotelData.hotelAddress || 'Address',
                checkInDate: booking.booking_data.checkInDate || booking.booking_data.checkIn,
                checkOutDate: booking.booking_data.checkOutDate || booking.booking_data.checkOut,
                roomType: booking.booking_data.selectedRoom?.name || booking.booking_data.room?.description?.text || 'Standard Room',
                guests: booking.booking_data.guests || booking.booking_data.adults || 2,
                nights: booking.booking_data.nights || 1,
                totalPrice: booking.total_price,
                currency: booking.currency
              }
            });
            
            if (emailResult.error) {
              console.error('❌ Failed to send Amadeus confirmation email:', emailResult.error);
            } else {
              console.log('✅ Amadeus confirmation email sent successfully');
            }
          } else {
            console.error('❌ Amadeus booking failed:', amadeusBookingResult.error);
          }
        } catch (amadeusError) {
          console.error('Failed to create Amadeus booking:', amadeusError);
          await supabaseClient
            .from('bookings')
            .update({ status: 'cancelled' })
            .eq('id', actualBookingId);
        }
      } else {
        // For non-Amadeus/Expedia bookings, just mark as confirmed
        const { error: bookingError } = await supabaseClient
          .from('bookings')
          .update({
            status: 'confirmed'
          })
          .eq('id', actualBookingId);

        if (bookingError) {
          console.error('Booking update error:', bookingError);
        }
      }
    }

    // Get final updated booking
    const { data: finalBooking } = await supabaseClient
      .from('bookings')
      .select('*, guests(*)')
      .eq('id', actualBookingId)
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
