// src/components/BookingTimeline.tsx
const steps = [
  { id: "matched", label: "Matched with partner" },
  { id: "awaiting_payment", label: "Confirm & pay" },
  { id: "paid", label: "Payment received" },
  { id: "in_progress", label: "Trip in progress" },
  { id: "completed", label: "Trip completed" },
  { id: "disputed", label: "Under review" },
];

export function BookingTimeline({ status }: { status: string }) {
  const currentIndex = steps.findIndex((s) => s.id === status);
  return (
    <div className="rounded-3xl bg-card border border-border p-4 text-xs">
      <p className="text-xs font-semibold mb-3">
        Booking status: <span className="text-primary">{status}</span>
      </p>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-0">
        {steps.map((step, index) => {
          const done = currentIndex > index;
          const active = currentIndex === index;
          return (
            <div
              key={step.id}
              className="flex items-center md:flex-1 md:justify-center gap-1"
            >
              <div
                className={[
                  "h-5 w-5 rounded-full flex items-center justify-center border text-[9px]",
                  done
                    ? "bg-primary text-primary-foreground border-primary"
                    : active
                    ? "bg-background text-primary border-primary"
                    : "bg-muted text-muted-foreground border-muted",
                ].join(" ")}
              >
                {index + 1}
              </div>
              <span className="text-[10px] text-muted-foreground">
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div className="hidden md:block flex-1 h-px bg-gradient-to-r from-muted to-transparent ml-2" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
