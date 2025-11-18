import { ArrowRight, Sparkles, Camera, Wallet, Globe2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function CreatorsPage() {
  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225]">
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 pt-16 pb-10 md:pt-20 md:pb-14">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] border border-[#E5DFC6] mb-4">
          <Sparkles className="h-3 w-3 text-[#BFAD72]" />
          <span className="tracking-[0.16em] uppercase text-[#8D8D8D]">
            For TikTok travel creators
          </span>
        </div>

        <div className="grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-center">
          <div className="space-y-4">
            <h1 className="font-display text-[28px] md:text-[32px] leading-tight">
              Turn your trips into a bookable library.
            </h1>
            <p className="text-[12px] md:text-[13px] text-[#4a4a4a] max-w-xl">
              Goldsainte lets you turn the trips you already film into curated,
              bookable storyboards. Travel agents handle the logistics. Your
              audience books. You get paid.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                to="/tiktok-lab"
                className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47] text-[#E5DFC6] px-4 py-2 text-[11px] font-semibold hover:bg-[#073331]"
              >
                Start in Goldsainte Creator Lab
                <ArrowRight className="h-3 w-3" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-1 text-[11px] text-[#0c4d47] underline underline-offset-4"
              >
                See how it works
              </a>
            </div>

            <p className="text-[10px] text-[#8D8D8D] pt-2 max-w-sm">
              No brand contracts required. You keep creative control; vetted
              travel agents plug in pricing and handle bookings on your behalf.
            </p>
          </div>

          {/* Visual card */}
          <div className="relative">
            <div className="rounded-3xl bg-white shadow-lg shadow-black/5 border border-[#E5DFC6] p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
                    Creator snapshot
                  </p>
                  <p className="text-[12px] font-semibold">Your trip library</p>
                </div>
                <span className="rounded-full bg-[#0c4d47] text-[#E5DFC6] px-3 py-1 text-[10px]">
                  Bookable content
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div className="rounded-2xl bg-[#f7f3ea] p-2">
                  <p className="text-[#8D8D8D] mb-1">Storyboards</p>
                  <p className="text-[14px] font-semibold">12</p>
                  <p className="text-[#8D8D8D]">live</p>
                </div>
                <div className="rounded-2xl bg-[#f7f3ea] p-2">
                  <p className="text-[#8D8D8D] mb-1">Requests</p>
                  <p className="text-[14px] font-semibold">34</p>
                  <p className="text-[#8D8D8D]">this month</p>
                </div>
                <div className="rounded-2xl bg-[#f7f3ea] p-2">
                  <p className="text-[#8D8D8D] mb-1">Earnings</p>
                  <p className="text-[14px] font-semibold">$4,280</p>
                  <p className="text-[#8D8D8D]">pending</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-[#4a4a4a] border-t border-[#E5DFC6] pt-2">
                <Camera className="h-3 w-3 text-[#BFAD72]" />
                <span>
                  Turn a TikTok into a storyboard in minutes — we do the
                  structuring; agents do the pricing.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value pillars */}
      <section className="mx-auto max-w-5xl px-4 pb-12 md:pb-16">
        <div className="grid gap-4 md:grid-cols-3 text-[11px]">
          <div className="rounded-3xl bg-white border border-[#E5DFC6] p-4 space-y-2">
            <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#f7f3ea]">
              <Wallet className="h-3 w-3 text-[#0c4d47]" />
            </div>
            <p className="text-[12px] font-semibold">
              Earn when your audience books
            </p>
            <p className="text-[#4a4a4a]">
              Share your Goldsainte link in bio or comments. When someone books
              a trip inspired by your storyboard, you earn a share — without
              chasing brand deals.
            </p>
          </div>

          <div className="rounded-3xl bg-white border border-[#E5DFC6] p-4 space-y-2">
            <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#f7f3ea]">
              <Globe2 className="h-3 w-3 text-[#0c4d47]" />
            </div>
            <p className="text-[12px] font-semibold">
              Agents handle logistics
            </p>
            <p className="text-[#4a4a4a]">
              Verified travel agents plug in live pricing, secure rates and take
              care of bookings. You stay in your lane as creative director of
              the trip.
            </p>
          </div>

          <div className="rounded-3xl bg-white border border-[#E5DFC6] p-4 space-y-2">
            <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#f7f3ea]">
              <Sparkles className="h-3 w-3 text-[#0c4d47]" />
            </div>
            <p className="text-[12px] font-semibold">
              A luxury storefront for your trips
            </p>
            <p className="text-[#4a4a4a]">
              Your profile becomes a curated wall of trips, not random links.
              Travelers can request exactly what they saw in your videos.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="mx-auto max-w-5xl px-4 pb-16 md:pb-20"
      >
        <div className="rounded-3xl bg-white border border-[#E5DFC6] p-4 md:p-6 text-[11px] space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#8D8D8D]">
                How it works
              </p>
              <p className="text-[13px] font-semibold">
                From TikTok clip to bookable trip
              </p>
            </div>
          </div>

          <ol className="space-y-3">
            <li className="flex gap-3">
              <div className="mt-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-[#0c4d47] text-[#E5DFC6] text-[10px]">
                1
              </div>
              <div>
                <p className="text-[12px] font-semibold">
                  Set up your Goldsainte profile
                </p>
                <p className="text-[#4a4a4a]">
                  Claim your creator profile, connect TikTok and add your travel
                  niches — cities, hotel types and trip styles.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="mt-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-[#0c4d47] text-[#E5DFC6] text-[10px]">
                2
              </div>
              <div>
                <p className="text-[12px] font-semibold">
                  Turn content into storyboards
                </p>
                <p className="text-[#4a4a4a]">
                  For each trip you feature, create a storyboard: destination,
                  3–7 key moments and a starting budget. Goldsainte AI can help
                  you outline it.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="mt-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-[#0c4d47] text-[#E5DFC6] text-[10px]">
                3
              </div>
              <div>
                <p className="text-[12px] font-semibold">
                  Partner with travel agents
                </p>
                <p className="text-[#4a4a4a]">
                  Verified agents attach to your storyboard, add live hotel and
                  flight options, and make it instantly bookable.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="mt-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-[#0c4d47] text-[#E5DFC6] text-[10px]">
                4
              </div>
              <div>
                <p className="text-[12px] font-semibold">
                  Share your Goldsainte link
                </p>
                <p className="text-[#4a4a4a]">
                  Add your Goldsainte link to your bio or pin it under relevant
                  videos. Followers land on a clean, luxury storefront of your
                  curated trips.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="mt-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-[#0c4d47] text-[#E5DFC6] text-[10px]">
                5
              </div>
              <div>
                <p className="text-[12px] font-semibold">
                  Earn from every booking
                </p>
                <p className="text-[#4a4a4a]">
                  Goldsainte handles secure payments, escrow and payouts. You
                  track your earnings in Goldsainte Creator Lab — clearly, without guessing.
                </p>
              </div>
            </li>
          </ol>

          <div className="pt-2 border-t border-[#E5DFC6] flex flex-wrap items-center justify-between gap-3">
            <p className="text-[10px] text-[#8D8D8D] max-w-sm">
              You never have to send invoices or collect payments in DMs. We
              protect the traveler, you and the agent in one place.
            </p>
            <Link
              to="/signup?role=creator"
              className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47] text-[#E5DFC6] px-4 py-2 text-[11px] font-semibold hover:bg-[#073331]"
            >
              Become a Goldsainte creator
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
