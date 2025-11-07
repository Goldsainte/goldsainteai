/**
 * Server-side date validation utilities
 * CRITICAL: These validations prevent bypassing client-side checks
 */

export interface DateValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates date format (YYYY-MM-DD)
 */
export function isValidDateFormat(dateString: string): boolean {
  if (!dateString) return false;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;
  
  // Check if it's a valid date
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Validates that a date is not in the past
 */
export function isNotPastDate(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date >= today;
}

/**
 * Validates hotel date range
 */
export function validateHotelDates(
  checkIn: string,
  checkOut: string
): DateValidationResult {
  // Validate format
  if (!isValidDateFormat(checkIn)) {
    return { valid: false, error: 'Invalid check-in date format. Use YYYY-MM-DD.' };
  }
  
  if (!isValidDateFormat(checkOut)) {
    return { valid: false, error: 'Invalid check-out date format. Use YYYY-MM-DD.' };
  }
  
  // Check if dates are in the past
  if (!isNotPastDate(checkIn)) {
    return { valid: false, error: 'Check-in date cannot be in the past.' };
  }
  
  if (!isNotPastDate(checkOut)) {
    return { valid: false, error: 'Check-out date cannot be in the past.' };
  }
  
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  
  // Check if check-out is after check-in
  if (checkOutDate <= checkInDate) {
    return { valid: false, error: 'Check-out date must be at least 1 day after check-in.' };
  }
  
  // Check minimum stay (1 night)
  const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 1) {
    return { valid: false, error: 'Minimum stay is 1 night.' };
  }
  
  // Check maximum date range (365 days)
  if (diffDays > 365) {
    return { valid: false, error: 'Date range cannot exceed 365 days.' };
  }
  
  return { valid: true };
}

/**
 * Validates flight dates
 */
export function validateFlightDates(
  departureDate: string,
  returnDate?: string
): DateValidationResult {
  // Validate departure date format
  if (!isValidDateFormat(departureDate)) {
    return { valid: false, error: 'Invalid departure date format. Use YYYY-MM-DD.' };
  }
  
  // Check if departure date is in the past
  if (!isNotPastDate(departureDate)) {
    return { valid: false, error: 'Departure date cannot be in the past.' };
  }
  
  // If round-trip, validate return date
  if (returnDate) {
    if (!isValidDateFormat(returnDate)) {
      return { valid: false, error: 'Invalid return date format. Use YYYY-MM-DD.' };
    }
    
    if (!isNotPastDate(returnDate)) {
      return { valid: false, error: 'Return date cannot be in the past.' };
    }
    
    const departure = new Date(departureDate);
    const returnD = new Date(returnDate);
    
    // Check if return is after departure
    if (returnD <= departure) {
      return { valid: false, error: 'Return date must be after departure date.' };
    }
    
    // Check maximum date range (365 days)
    const diffTime = Math.abs(returnD.getTime() - departure.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 365) {
      return { valid: false, error: 'Date range cannot exceed 365 days.' };
    }
  }
  
  return { valid: true };
}

/**
 * Validates numeric parameters to prevent injection
 */
export function validateNumericParam(
  value: any,
  paramName: string,
  min: number,
  max: number
): DateValidationResult {
  const num = parseInt(value);
  
  if (isNaN(num)) {
    return { valid: false, error: `${paramName} must be a number.` };
  }
  
  if (num < min || num > max) {
    return { valid: false, error: `${paramName} must be between ${min} and ${max}.` };
  }
  
  return { valid: true };
}
