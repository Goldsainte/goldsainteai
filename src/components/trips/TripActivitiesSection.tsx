import { Check, Sparkles } from "lucide-react";

interface Activity {
  id: string;
  name: string;
  description?: string;
  is_included: boolean;
  additional_fee?: number;
  currency?: string;
}

interface TripActivitiesSectionProps {
  activities: Activity[];
}

export function TripActivitiesSection({ activities }: TripActivitiesSectionProps) {
  const includedActivities = activities.filter((a) => a.is_included);
  const optionalActivities = activities.filter((a) => !a.is_included);

  if (activities.length === 0) return null;

  const formatPrice = (fee: number, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(fee);
  };

  return (
    <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6">
      {/* Included Activities */}
      {includedActivities.length > 0 && (
        <div>
          <h2 className="font-secondary text-xl font-semibold text-[#0a2225]">
            Trip Activities
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {includedActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 rounded-xl border border-[#E5DFC6]/50 bg-[#FDF9F0] p-4"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0C4D47]">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-[#0a2225]">{activity.name}</p>
                  {activity.description && (
                    <p className="mt-1 text-sm text-[#6B7280]">{activity.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optional Activities */}
      {optionalActivities.length > 0 && (
        <div className={includedActivities.length > 0 ? "mt-8" : ""}>
          <div className="flex items-center gap-2">
            <h3 className="font-secondary text-lg font-semibold text-[#0a2225]">
              Optional Activities*
            </h3>
            <Sparkles className="h-4 w-4 text-[#C7B892]" />
          </div>
          <p className="mt-1 text-xs text-[#6B7280]">
            *Add-ons available at checkout for an additional fee.
          </p>
          
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {optionalActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-[#E5DFC6] bg-white p-4"
              >
                <div>
                  <p className="font-medium text-[#0a2225]">{activity.name}</p>
                  {activity.description && (
                    <p className="mt-1 text-sm text-[#6B7280] line-clamp-2">
                      {activity.description}
                    </p>
                  )}
                </div>
                {activity.additional_fee && (
                  <span className="flex-shrink-0 rounded-full bg-[#C7B892]/20 px-3 py-1 text-sm font-medium text-[#0a2225]">
                    {formatPrice(activity.additional_fee, activity.currency)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
