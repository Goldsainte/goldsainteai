// Trip request status state machine
// Defines allowed status transitions based on user role

export type TripRequestStatus =
  | "open"        // Initial state (traveler submitted)
  | "matched"     // AI assigned candidates
  | "in_progress" // Creator/agent working
  | "completed"   // Trip done
  | "cancelled";  // Closed without completion

export type TripRole = "traveler" | "creator_agent" | "admin";

// Define allowed transitions per role
const transitions: Record<
  TripRequestStatus,
  Partial<Record<TripRole, TripRequestStatus[]>>
> = {
  open: {
    admin: ["matched", "cancelled"],
    creator_agent: ["in_progress"], // If they manually pick it up
    traveler: ["cancelled"], // Owner may close their own request before anyone picks it up
  },
  matched: {
    creator_agent: ["in_progress"],
    admin: ["in_progress", "cancelled"],
  },
  in_progress: {
    creator_agent: ["completed", "cancelled"],
    admin: ["completed", "cancelled"],
  },
  completed: {
    admin: ["in_progress"], // Allow reopening if needed
  },
  cancelled: {
    admin: ["open"], // Allow re-opening in edge cases
  },
};

/**
 * Get available status transitions for current status and user role
 */
export function getAvailableTransitions(
  current: TripRequestStatus,
  role: TripRole
): TripRequestStatus[] {
  return transitions[current]?.[role] ?? [];
}

/**
 * Check if a status transition is allowed
 */
export function canTransition(
  current: TripRequestStatus,
  next: TripRequestStatus,
  role: TripRole
): boolean {
  const available = getAvailableTransitions(current, role);
  return available.includes(next);
}
