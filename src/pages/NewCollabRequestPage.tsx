import { useSearchParams } from "react-router-dom";

export default function NewCollabRequestPage() {
  const [searchParams] = useSearchParams();
  const creatorId = searchParams.get("creatorId");

  // TODO: fetch creator info by ID
  const creatorName = "Travel with Maya";

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-3xl px-4 py-8 md:py-10">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Propose a collaboration
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Start a collab with{" "}
            <span className="font-semibold">{creatorName}</span> to promote a
            Goldsainte trip on TikTok.
          </p>
        </header>

        <section className="mt-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200/80">
          <form className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-neutral-700">
                Trip or offer
              </label>
              <input
                type="text"
                placeholder="7-night Santorini Honeymoon Escape"
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-neutral-700">
                What are you proposing?
              </label>
              <textarea
                rows={4}
                placeholder="Describe the trip, what kind of TikTok content you want, and how compensation will work (flat fee, revenue share, bonuses, etc.)."
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-neutral-700">
                Ideal posting window
              </label>
              <input
                type="text"
                placeholder="e.g., 2 posts in the 2 weeks leading up to Valentine's Day"
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-neutral-700">
                Compensation structure
              </label>
              <input
                type="text"
                placeholder="e.g., 10% of trip revenue + $300 content fee"
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="button"
                className="inline-flex w-full items-center justify-center rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800"
              >
                Send collaboration request
              </button>
              <p className="mt-2 text-[11px] text-neutral-500">
                Goldsainte will notify the creator and keep this proposal
                visible in both of your dashboards.
              </p>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}