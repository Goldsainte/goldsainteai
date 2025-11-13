import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type TripFormState = {
  tripTitle: string;
  destination: string;
  departingFrom: string;
  startDate: string;
  endDate: string;
  flexibleDates: boolean;
  travelers: string;
  tripType: string;
  travelStyle: string;
  budgetMin: string;
  budgetMax: string;
  description: string;
  specialRequests: string;
};

const initialState: TripFormState = {
  tripTitle: "",
  destination: "",
  departingFrom: "",
  startDate: "",
  endDate: "",
  flexibleDates: false,
  travelers: "",
  tripType: "",
  travelStyle: "",
  budgetMin: "",
  budgetMax: "",
  description: "",
  specialRequests: "",
};

export default function RequestTrip() {
  const [form, setForm] = useState<TripFormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      toast.error("Please sign in to post a trip request");
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  function handleChange(
    field: keyof TripFormState,
    value: string | boolean
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("Please sign in to post a trip request");
      navigate("/auth");
      return;
    }

    if (!form.destination || !form.tripTitle || !form.travelers) {
      setError("Please fill in trip title, destination, and number of travelers.");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from("marketplace_jobs").insert({
        user_id: user.id,
        title: form.tripTitle,
        description: form.description,
        destination: form.destination,
        booking_type: "full_planning",
        number_of_travelers: parseInt(form.travelers),
        budget_min: form.budgetMin ? parseFloat(form.budgetMin) : null,
        budget_max: form.budgetMax ? parseFloat(form.budgetMax) : null,
        currency: "USD",
        status: "open",
        travel_dates: {
          startDate: form.startDate,
          endDate: form.endDate,
          flexibleDates: form.flexibleDates,
        },
        requirements: {
          departingFrom: form.departingFrom,
          tripType: form.tripType,
          travelStyle: form.travelStyle,
          specialRequests: form.specialRequests,
        },
      } as any);

      if (error) throw error;

      toast.success("Trip request posted successfully!");
      setSubmitted(true);
      setForm(initialState);
      
      setTimeout(() => {
        navigate("/marketplace?tab=requests");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
      toast.error("Failed to post trip request");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mb-3 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              ← Back to marketplace
            </button>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Post your dream trip
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground md:text-base">
              Describe your perfect trip and let certified agents and travel
              creators bid to design it for you—flights, hotels, experiences,
              and more.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6 md:flex-row">
          <div className="w-full md:w-2/3">
            <form
              onSubmit={handleSubmit}
              className="space-y-6 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border md:p-6"
            >
              <section className="space-y-4">
                <h2 className="text-sm font-semibold text-foreground">
                  Trip basics
                </h2>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Trip title
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="e.g. Honeymoon in Santorini, Summer 2026"
                    value={form.tripTitle}
                    onChange={(e) => handleChange("tripTitle", e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    This is the headline agents and creators will see.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Where do you want to go?
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="City / region / multiple destinations"
                      value={form.destination}
                      onChange={(e) =>
                        handleChange("destination", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Departing from
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Home airport or city"
                      value={form.departingFrom}
                      onChange={(e) =>
                        handleChange("departingFrom", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Start date
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                      value={form.startDate}
                      onChange={(e) =>
                        handleChange("startDate", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      End date
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                      value={form.endDate}
                      onChange={(e) =>
                        handleChange("endDate", e.target.value)
                      }
                    />
                  </div>

                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-xs font-medium text-foreground">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                        checked={form.flexibleDates}
                        onChange={(e) =>
                          handleChange("flexibleDates", e.target.checked)
                        }
                      />
                      Dates are flexible
                    </label>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Travelers
                    </label>
                    <input
                      type="number"
                      min={1}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Number of people"
                      value={form.travelers}
                      onChange={(e) =>
                        handleChange("travelers", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Trip type
                    </label>
                    <select
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                      value={form.tripType}
                      onChange={(e) =>
                        handleChange("tripType", e.target.value)
                      }
                    >
                      <option value="">Select type</option>
                      <option value="honeymoon">Honeymoon</option>
                      <option value="family">Family vacation</option>
                      <option value="business">Business trip</option>
                      <option value="solo">Solo trip</option>
                      <option value="friends">Friends trip</option>
                      <option value="content-retreat">
                        Creator retreat / content trip
                      </option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Travel style
                    </label>
                    <select
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                      value={form.travelStyle}
                      onChange={(e) =>
                        handleChange("travelStyle", e.target.value)
                      }
                    >
                      <option value="">Select style</option>
                      <option value="luxury">Luxury</option>
                      <option value="premium">Premium</option>
                      <option value="mid-range">Mid-range</option>
                      <option value="budget">Budget-conscious</option>
                      <option value="adventure">Adventure / active</option>
                      <option value="relaxation">Relaxation / wellness</option>
                    </select>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-sm font-semibold text-foreground">
                  Budget
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Share a realistic range for the whole trip (per group, not per
                  person). Agents and creators will use this to design options.
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Minimum budget (USD)
                    </label>
                    <input
                      type="number"
                      min={0}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="e.g. 4000"
                      value={form.budgetMin}
                      onChange={(e) =>
                        handleChange("budgetMin", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Maximum budget (USD)
                    </label>
                    <input
                      type="number"
                      min={0}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="e.g. 8000"
                      value={form.budgetMax}
                      onChange={(e) =>
                        handleChange("budgetMax", e.target.value)
                      }
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-sm font-semibold text-foreground">
                  Tell us about your dream trip
                </h2>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    What would make this trip perfect?
                  </label>
                  <textarea
                    rows={5}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Share your must-see places, experiences, hotel preferences, airline preferences, non-negotiables, and what a perfect day on this trip looks like."
                    value={form.description}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Special requests or constraints
                  </label>
                  <textarea
                    rows={3}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Accessibility needs, dietary restrictions, loyalty programs (e.g. Marriott, Delta), preferred cabin class, etc."
                    value={form.specialRequests}
                    onChange={(e) =>
                      handleChange("specialRequests", e.target.value)
                    }
                  />
                </div>
              </section>

              <section className="space-y-2">
                <h2 className="text-sm font-semibold text-foreground">
                  Inspiration (optional)
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  You can add mood boards, sample itineraries, or screenshots in
                  the next step after posting your request.
                </p>
                <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-muted px-4 py-3 text-[11px] text-muted-foreground">
                  File uploads coming soon – agents can still respond with full
                  proposals.
                </div>
              </section>

              <div className="space-y-3 pt-2">
                {error && (
                  <div className="rounded-xl border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {error}
                  </div>
                )}

                {submitted && !error && (
                  <div className="rounded-xl border border-primary/50 bg-primary/10 px-3 py-2 text-xs text-primary">
                    Your trip request has been posted! Certified agents and
                    creators will begin submitting proposals soon.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? "Posting your trip..." : "Post trip request"}
                </button>

                <p className="text-[11px] text-muted-foreground">
                  By posting, you agree to allow certified agents and verified
                  creators on Goldsainte to view and bid on your trip. You'll be
                  able to review proposals, chat, and approve payments securely
                  through the platform.
                </p>
              </div>
            </form>
          </div>

          <aside className="w-full md:w-1/3">
            <div className="sticky top-20 space-y-4">
              <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
                <h3 className="text-sm font-semibold text-foreground">
                  How it works
                </h3>
                <ol className="mt-2 space-y-2 text-xs text-muted-foreground">
                  <li>
                    <span className="font-semibold">1.</span> Tell us where,
                    when, and how you like to travel.
                  </li>
                  <li>
                    <span className="font-semibold">2.</span> Certified travel
                    agents and vetted creators see your request and submit
                    proposals.
                  </li>
                  <li>
                    <span className="font-semibold">3.</span> Compare itineraries,
                    pricing, and reviews—all in one place.
                  </li>
                  <li>
                    <span className="font-semibold">4.</span> Approve your
                    favorite proposal, pay securely, and let them handle the
                    bookings.
                  </li>
                </ol>
              </div>

              <div className="rounded-2xl bg-primary p-4 text-sm text-primary-foreground shadow-sm">
                <h3 className="text-sm font-semibold">
                  Designed for complex trips
                </h3>
                <p className="mt-2 text-xs opacity-90">
                  Goldsainte is built for honeymoons, multi-country itineraries,
                  retreats, creator trips, and once-in-a-lifetime experiences.
                  Let professionals leverage their airline and hotel
                  relationships to unlock upgrades and value you can't get on
                  your own.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
