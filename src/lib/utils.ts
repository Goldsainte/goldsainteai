import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Safe encoding for URL parameters with nested URLs
export function encodeData(data: any): string {
  try {
    return btoa(encodeURIComponent(JSON.stringify(data)));
  } catch (error) {
    console.error('Error encoding data:', error);
    return '';
  }
}

// Safe decoding for URL parameters with nested URLs
export function decodeData(encoded: string): any {
  try {
    return JSON.parse(decodeURIComponent(atob(encoded)));
  } catch (error) {
    console.error('Error decoding data:', error);
    // Fallback: try direct JSON parse
    try {
      return JSON.parse(encoded);
    } catch {
      return null;
    }
  }
}
