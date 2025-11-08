# Goldsainte AI Search Tools

## Overview

The Goldsainte Search API layer normalizes inputs/outputs from external providers (Amadeus, Ticketmaster) into a stable, consistent schema. The LLM **never calls external APIs directly**—it only invokes our search tools via function/tool calling.

## Core Principles

1. **Always call Goldsainte Search tools** for hotels, flights, and events
2. **Ask for missing essentials in at most two questions**, then run the search
3. **Never fabricate results**—only return data from actual API responses
4. **Retry once with broader parameters** if zero results, then offer top 3 alternatives
5. **Present results consistently**: same fields, same order, same tone every time

## Available Tools

### 1. search-hotels

**Endpoint**: `POST /functions/v1/search-hotels`

**Purpose**: Search for hotels using Amadeus API with normalized output.

**Required Parameters**:
```typescript
{
  cityCode: string;          // IATA city code (e.g., "PAR" for Paris)
  checkInDate: string;       // ISO 8601 date (YYYY-MM-DD)
  checkOutDate: string;      // ISO 8601 date (YYYY-MM-DD)
}
```

**Optional Parameters**:
```typescript
{
  adults?: number;           // Number of adults (default: 1)
  radius?: number;           // Search radius from city center
  radiusUnit?: 'KM' | 'MILE'; // Unit for radius (default: 'KM')
  ratings?: string[];        // Hotel star ratings (e.g., ["4", "5"])
  amenities?: string[];      // Required amenities
  priceRange?: string;       // Price range filter
  currency?: string;         // Preferred currency (e.g., "USD")
}
```

**Response Schema**:
```typescript
{
  results: Array<{
    id: string;
    name: string;
    location: {
      latitude: number;
      longitude: number;
      address: string;
      cityCode: string;
    };
    rating: number;          // Star rating (0-5)
    price: {
      amount: number;        // Total price
      currency: string;      // ISO currency code
    };
    amenities: string[];     // Available amenities
    images: string[];        // Image URLs
    distance?: {             // Distance from city center
      value: number;
      unit: string;
    };
  }>;
  suggestions?: string[];    // Only present if results is empty
}
```

**Sorting**: Results are sorted by **price ascending**, then **rating descending**.

**Zero Results Behavior**: If no results found, automatically retries with:
- Expanded radius (doubled, max 50km)
- Removed rating filters
- Removed amenity filters

If still no results, returns empty array with 3 suggestions.

---

### 2. search-flights

**Endpoint**: `POST /functions/v1/search-flights`

**Purpose**: Search for flights using Amadeus API with normalized output.

**Required Parameters**:
```typescript
{
  originLocationCode: string;      // IATA airport code (e.g., "JFK")
  destinationLocationCode: string; // IATA airport code (e.g., "LAX")
  departureDate: string;           // ISO 8601 date (YYYY-MM-DD)
}
```

**Optional Parameters**:
```typescript
{
  returnDate?: string;             // ISO 8601 date for round trip
  adults?: number;                 // Number of adults (default: 1)
  children?: number;               // Number of children
  infants?: number;                // Number of infants
  travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  nonStop?: boolean;               // Only non-stop flights
  currencyCode?: string;           // Preferred currency (e.g., "USD")
  maxPrice?: number;               // Maximum price filter
  max?: number;                    // Maximum results (default: 50)
}
```

**Response Schema**:
```typescript
{
  results: Array<{
    id: string;
    price: {
      amount: number;              // Total price
      currency: string;            // ISO currency code
    };
    itineraries: Array<{
      duration: string;            // ISO 8601 duration (e.g., "PT5H30M")
      segments: Array<{
        departure: {
          iataCode: string;        // Airport code
          terminal?: string;
          at: string;              // ISO 8601 timestamp
        };
        arrival: {
          iataCode: string;
          terminal?: string;
          at: string;
        };
        carrierCode: string;       // Airline code
        number: string;            // Flight number
        aircraft: {
          code: string;            // Aircraft type
        };
        duration: string;          // Segment duration
      }>;
    }>;
    validatingAirlineCodes: string[];
    travelerPricings: Array<{
      fareOption: string;
      travelerType: string;
      price: {
        amount: number;
        currency: string;
      };
    }>;
  }>;
  suggestions?: string[];          // Only present if results is empty
}
```

**Sorting**: Results are sorted by **price ascending**, then **total duration ascending**.

**Zero Results Behavior**: If no results found, automatically retries with:
- Non-stop requirement removed
- Travel class filter removed
- Max price filter removed

If still no results, returns empty array with 3 suggestions.

---

### 3. search-events

**Endpoint**: `POST /functions/v1/search-events`

**Purpose**: Search for events using Ticketmaster API with normalized output.

**Optional Parameters** (at least one location parameter required):
```typescript
{
  keyword?: string;              // Event keyword search
  city?: string;                 // City name
  countryCode?: string;          // ISO country code (e.g., "US")
  latitude?: number;             // Geo coordinates
  longitude?: number;
  radius?: number;               // Search radius (default: 50)
  unit?: 'miles' | 'km';         // Distance unit (default: 'km')
  startDateTime?: string;        // ISO 8601 timestamp
  endDateTime?: string;          // ISO 8601 timestamp
  size?: number;                 // Max results (default: 20)
  page?: number;                 // Page number (default: 0)
  sort?: 'date,asc' | 'date,desc' | 'relevance,asc' | 'relevance,desc';
}
```

**Response Schema**:
```typescript
{
  results: Array<{
    id: string;
    name: string;
    type: string;                // Event type
    url: string;                 // Ticketmaster URL
    locale: string;
    images: Array<{
      url: string;
      width: number;
      height: number;
    }>;
    dates: {
      start: {
        localDate: string;       // YYYY-MM-DD
        localTime?: string;      // HH:MM:SS
      };
      timezone?: string;
      status: {
        code: string;
      };
    };
    priceRanges?: Array<{
      type: string;
      currency: string;
      min: number;
      max: number;
    }>;
    venues?: Array<{
      name: string;
      city: {
        name: string;
      };
      state?: {
        name: string;
        stateCode: string;
      };
      country: {
        name: string;
        countryCode: string;
      };
      address?: {
        line1?: string;
      };
      location?: {
        latitude: string;
        longitude: string;
      };
    }>;
    classifications?: Array<{
      segment: {
        name: string;
      };
      genre?: {
        name: string;
      };
    }>;
  }>;
  suggestions?: string[];        // Only present if results is empty
}
```

**Sorting**: Results are sorted by **date ascending**, then **price ascending**.

**Zero Results Behavior**: If no results found, automatically retries with:
- Keyword filter removed
- Radius doubled (max 200km/miles)

If still no results, returns empty array with 3 suggestions.

---

## AI System Prompt Integration

When building AI assistants that need to search for travel content, include these instructions in the system prompt:

```
You are a travel assistant with access to Goldsainte Search tools. Follow these rules:

1. ALWAYS use search-hotels, search-flights, or search-events for data queries
2. Ask for missing required parameters (max 2 questions), then execute the search
3. NEVER fabricate results—only show data from actual API responses
4. If zero results after retry, offer the top 3 suggestions from the response
5. Present results consistently: same fields, same order, same professional tone

Tool Calling Examples:

For hotels:
{
  "tool": "search-hotels",
  "parameters": {
    "cityCode": "LON",
    "checkInDate": "2025-06-15",
    "checkOutDate": "2025-06-20",
    "adults": 2,
    "currency": "USD"
  }
}

For flights:
{
  "tool": "search-flights",
  "parameters": {
    "originLocationCode": "JFK",
    "destinationLocationCode": "CDG",
    "departureDate": "2025-07-01",
    "returnDate": "2025-07-15",
    "adults": 1,
    "travelClass": "ECONOMY"
  }
}

For events:
{
  "tool": "search-events",
  "parameters": {
    "city": "New York",
    "countryCode": "US",
    "startDateTime": "2025-05-01T00:00:00Z",
    "endDateTime": "2025-05-31T23:59:59Z"
  }
}
```

---

## Error Handling

All endpoints return consistent error responses:

```typescript
{
  error: string;  // Human-readable error message
}
```

**Common Error Codes**:
- `400`: Missing required parameters
- `500`: External API error or server error

**Logging**: All functions log detailed information for debugging:
- Request parameters
- API responses
- Error details
- Retry attempts

---

## Currency Support

All price-related results include:
- `amount`: Numeric value
- `currency`: ISO 4217 currency code (e.g., "USD", "EUR", "GBP")

The LLM should format prices according to the user's preference or detected locale.

---

## Testing

To test these endpoints locally or in production:

```bash
# Hotels
curl -X POST https://your-project.supabase.co/functions/v1/search-hotels \
  -H "Content-Type: application/json" \
  -d '{
    "cityCode": "NYC",
    "checkInDate": "2025-06-01",
    "checkOutDate": "2025-06-05"
  }'

# Flights
curl -X POST https://your-project.supabase.co/functions/v1/search-flights \
  -H "Content-Type: application/json" \
  -d '{
    "originLocationCode": "LAX",
    "destinationLocationCode": "JFK",
    "departureDate": "2025-06-15"
  }'

# Events
curl -X POST https://your-project.supabase.co/functions/v1/search-events \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Los Angeles",
    "countryCode": "US"
  }'
```

---

## Future Enhancements

- Add caching layer for frequently searched routes
- Implement rate limiting per user
- Add support for more providers (Expedia, Booking.com)
- Add analytics for search patterns
- Implement A/B testing for sorting algorithms

---

## Support

For issues or questions about the Goldsainte Search API:
1. Check edge function logs in the Lovable backend
2. Review API provider documentation (Amadeus, Ticketmaster)
3. Contact the engineering team
