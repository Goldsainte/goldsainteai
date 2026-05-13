import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}

// Comprehensive baggage policy database for major airlines
const BAGGAGE_POLICIES: { [key: string]: any } = {
  // US Carriers
  'AA': {
    airline: 'American Airlines',
    code: 'AA',
    carryOn: {
      basic: { allowed: true, dimensions: '22 x 14 x 9 inches', weight: 'No limit', personalItem: true },
      main: { allowed: true, dimensions: '22 x 14 x 9 inches', weight: 'No limit', personalItem: true },
      premium: { allowed: true, dimensions: '22 x 14 x 9 inches', weight: 'No limit', personalItem: true }
    },
    checked: {
      basic: { first: 30, second: 40, weight: '50 lbs', dimensions: '62 linear inches' },
      main: { first: 30, second: 40, weight: '50 lbs', dimensions: '62 linear inches' },
      premium: { first: 0, second: 40, weight: '50 lbs', dimensions: '62 linear inches' }
    }
  },
  'DL': {
    airline: 'Delta Air Lines',
    code: 'DL',
    carryOn: {
      basic: { allowed: false, dimensions: '22 x 14 x 9 inches', weight: 'No limit', personalItem: true, note: 'Carry-on not included in Basic Economy' },
      main: { allowed: true, dimensions: '22 x 14 x 9 inches', weight: 'No limit', personalItem: true },
      comfort: { allowed: true, dimensions: '22 x 14 x 9 inches', weight: 'No limit', personalItem: true }
    },
    checked: {
      basic: { first: 30, second: 40, weight: '50 lbs', dimensions: '62 linear inches' },
      main: { first: 30, second: 40, weight: '50 lbs', dimensions: '62 linear inches' },
      comfort: { first: 0, second: 40, weight: '50 lbs', dimensions: '62 linear inches' }
    }
  },
  'UA': {
    airline: 'United Airlines',
    code: 'UA',
    carryOn: {
      basic: { allowed: false, dimensions: '22 x 14 x 9 inches', weight: 'No limit', personalItem: true, note: 'Carry-on not included in Basic Economy' },
      economy: { allowed: true, dimensions: '22 x 14 x 9 inches', weight: 'No limit', personalItem: true },
      premium: { allowed: true, dimensions: '22 x 14 x 9 inches', weight: 'No limit', personalItem: true }
    },
    checked: {
      basic: { first: 30, second: 40, weight: '50 lbs', dimensions: '62 linear inches' },
      economy: { first: 30, second: 40, weight: '50 lbs', dimensions: '62 linear inches' },
      premium: { first: 0, second: 40, weight: '50 lbs', dimensions: '62 linear inches' }
    }
  },
  'WN': {
    airline: 'Southwest Airlines',
    code: 'WN',
    carryOn: {
      wanna_get_away: { allowed: true, dimensions: '24 x 16 x 10 inches', weight: 'No limit', personalItem: true },
      anytime: { allowed: true, dimensions: '24 x 16 x 10 inches', weight: 'No limit', personalItem: true },
      business_select: { allowed: true, dimensions: '24 x 16 x 10 inches', weight: 'No limit', personalItem: true }
    },
    checked: {
      all: { first: 0, second: 0, weight: '50 lbs', dimensions: '62 linear inches', note: 'First 2 bags free!' }
    }
  },
  // European Carriers
  'BA': {
    airline: 'British Airways',
    code: 'BA',
    carryOn: {
      basic: { allowed: true, dimensions: '22 x 18 x 10 inches', weight: '23 kg', personalItem: true },
      plus: { allowed: true, dimensions: '22 x 18 x 10 inches', weight: '23 kg', personalItem: true }
    },
    checked: {
      basic: { first: 40, second: 60, weight: '23 kg', dimensions: '90 x 75 x 43 cm' },
      plus: { first: 0, second: 40, weight: '23 kg', dimensions: '90 x 75 x 43 cm' }
    }
  },
  'LH': {
    airline: 'Lufthansa',
    code: 'LH',
    carryOn: {
      light: { allowed: false, dimensions: 'N/A', weight: 'N/A', personalItem: true, note: 'No cabin bag on Light fare' },
      classic: { allowed: true, dimensions: '55 x 40 x 23 cm', weight: '8 kg', personalItem: true },
      flex: { allowed: true, dimensions: '55 x 40 x 23 cm', weight: '8 kg', personalItem: true }
    },
    checked: {
      light: { first: 0, second: 70, weight: '23 kg', dimensions: '158 cm total' },
      classic: { first: 0, second: 70, weight: '23 kg', dimensions: '158 cm total' },
      flex: { first: 0, second: 70, weight: '23 kg', dimensions: '158 cm total' }
    }
  }
};

// Change/Cancel fee policies
const CHANGE_CANCEL_POLICIES: { [key: string]: any } = {
  'AA': {
    basic: {
      change: { domestic: 'Not allowed', international: 'Not allowed' },
      cancel: { domestic: 'Not allowed', international: 'Not allowed' },
      '24hrRule': 'Free cancellation within 24 hours of booking if booked 7+ days before departure'
    },
    main: {
      change: { domestic: '$0 (pay fare difference)', international: '$0 (pay fare difference)' },
      cancel: { domestic: 'Refundable as flight credit', international: 'Refundable as flight credit' },
      '24hrRule': 'Free cancellation within 24 hours of booking'
    }
  },
  'DL': {
    basic: {
      change: { domestic: 'Not allowed', international: 'Not allowed' },
      cancel: { domestic: 'Not allowed', international: 'Not allowed' },
      '24hrRule': 'Free cancellation within 24 hours of booking'
    },
    main: {
      change: { domestic: '$0 (pay fare difference)', international: '$0 (pay fare difference)' },
      cancel: { domestic: 'eCredit issued', international: 'eCredit issued' },
      '24hrRule': 'Free cancellation within 24 hours of booking'
    }
  },
  'UA': {
    basic: {
      change: { domestic: 'Not allowed', international: '$100 + fare difference' },
      cancel: { domestic: 'Not allowed', international: 'Travel credit minus $100' },
      '24hrRule': 'Free cancellation within 24 hours of booking'
    },
    economy: {
      change: { domestic: '$0 (pay fare difference)', international: '$0 (pay fare difference)' },
      cancel: { domestic: 'Travel credit issued', international: 'Travel credit issued' },
      '24hrRule': 'Free cancellation within 24 hours of booking'
    }
  },
  'WN': {
    all: {
      change: { all: '$0 (no change fees ever)' },
      cancel: { all: 'Full travel credit (minus $0 fee)' },
      '24hrRule': 'Free cancellation within 24 hours of booking',
      note: 'Southwest never charges change fees - industry leader in flexibility!'
    }
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const { airlineCode, fareClass, queryType = 'baggage' } = await req.json();
    
    console.log('Baggage policy lookup:', { airlineCode, fareClass, queryType });

    if (!airlineCode) {
      return new Response(JSON.stringify({ 
        error: 'Airline code required (e.g., "AA", "DL", "UA")' 
      }), {
        status: 400,
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
      });
    }

    const airline = airlineCode.toUpperCase();

    // Baggage policy query
    if (queryType === 'baggage' || queryType === 'both') {
      const policy = BAGGAGE_POLICIES[airline];

      if (!policy) {
        return new Response(JSON.stringify({
          error: 'Airline not found in database',
          airline: airlineCode,
          availableAirlines: Object.keys(BAGGAGE_POLICIES),
          suggestion: 'Try: AA, DL, UA, WN, BA, LH'
        }), {
          status: 404,
          headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
        });
      }

      const result: any = {
        airline: policy.airline,
        code: policy.code,
        queryType: 'baggage'
      };

      if (fareClass) {
        const normalizedClass = fareClass.toLowerCase().replace(/\s+/g, '_');
        result.fareClass = fareClass;
        result.carryOn = policy.carryOn[normalizedClass] || policy.carryOn.main || policy.carryOn.economy;
        result.checked = policy.checked[normalizedClass] || policy.checked.main || policy.checked.economy;
      } else {
        result.allClasses = policy;
      }

      // Add change/cancel if requested
      if (queryType === 'both') {
        const changeCancelPolicy = CHANGE_CANCEL_POLICIES[airline];
        if (changeCancelPolicy) {
          result.changeCancelPolicy = changeCancelPolicy;
        }
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
      });
    }

    // Change/Cancel policy query
    if (queryType === 'change_cancel') {
      const policy = CHANGE_CANCEL_POLICIES[airline];

      if (!policy) {
        return new Response(JSON.stringify({
          error: 'Change/cancel policy not found',
          airline: airlineCode,
          note: 'Policy data available for: AA, DL, UA, WN'
        }), {
          status: 404,
          headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
        });
      }

      const result: any = {
        airline: BAGGAGE_POLICIES[airline]?.airline || airlineCode,
        code: airline,
        queryType: 'change_cancel'
      };

      if (fareClass) {
        const normalizedClass = fareClass.toLowerCase().replace(/\s+/g, '_');
        result.fareClass = fareClass;
        result.policy = policy[normalizedClass] || policy.main || policy.economy || policy.all;
      } else {
        result.allClasses = policy;
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      error: 'Invalid query type. Use: baggage, change_cancel, or both'
    }), {
      status: 400,
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Baggage policy lookup error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
    });
  }
});
