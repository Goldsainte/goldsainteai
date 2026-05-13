import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://goldsainte.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EscrowRequest {
  bookingId: string;
  paymentId: string;
  totalAmount: number;
  platformFeePercentage?: number;
  milestones?: Array<{
    name: string;
    description?: string;
    percentage: number;
    dueDate?: string;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { bookingId, paymentId, totalAmount, platformFeePercentage = 15, milestones }: EscrowRequest = await req.json();

    // Get booking details
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('user_id, agent_id')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    // Calculate amounts
    const platformFee = totalAmount * (platformFeePercentage / 100);
    const creatorEarnings = totalAmount - platformFee;

    // Determine creator (agent or user who created the booking)
    const creatorId = booking.agent_id || booking.user_id;

    // Create escrow transaction
    const { data: escrowTransaction, error: escrowError } = await supabaseClient
      .from('escrow_transactions')
      .insert({
        booking_id: bookingId,
        payment_id: paymentId,
        creator_id: creatorId,
        customer_id: booking.user_id,
        total_amount: totalAmount,
        platform_fee: platformFee,
        creator_earnings: creatorEarnings,
        amount_held: creatorEarnings,
        status: 'held'
      })
      .select()
      .single();

    if (escrowError) {
      console.error('Escrow creation error:', escrowError);
      throw new Error(`Failed to create escrow: ${escrowError.message}`);
    }

    // Create milestones if provided, otherwise create default milestones
    const milestonesToCreate = milestones && milestones.length > 0
      ? milestones
      : [
          { name: 'Booking Confirmation', description: 'Initial booking confirmed', percentage: 20 },
          { name: 'Pre-Trip Preparation', description: 'Itinerary and documents provided', percentage: 30 },
          { name: 'Trip Completion', description: 'Trip successfully completed', percentage: 50 }
        ];

    const milestoneRecords = milestonesToCreate.map(m => ({
      escrow_transaction_id: escrowTransaction.id,
      milestone_name: m.name,
      milestone_description: m.description,
      percentage: m.percentage,
      amount: (creatorEarnings * m.percentage) / 100,
      due_date: m.dueDate || null
    }));

    const { error: milestonesError } = await supabaseClient
      .from('payment_milestones')
      .insert(milestoneRecords);

    if (milestonesError) {
      console.error('Milestones creation error:', milestonesError);
      throw new Error('Failed to create payment milestones');
    }

    console.log(`Escrow created: ${escrowTransaction.id} for booking ${bookingId}`);

    return new Response(
      JSON.stringify({
        success: true,
        escrowId: escrowTransaction.id,
        totalAmount,
        platformFee,
        creatorEarnings,
        milestonesCount: milestonesToCreate.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error creating escrow hold:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
