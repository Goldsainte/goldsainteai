// Founder statement — authentic "why we exist" from the founder (no customer
// reviews yet). Layout mirrors Fora's advisor-quote block: left-aligned large
// serif quote, then a horizontal row of round photo + name/title beneath.
import { useState } from "react";
import founderPhoto from "@/assets/founder.webp";

const inter = { fontFamily: "Inter, sans-serif" } as const;

export function FounderNote() {
  const [imgOk, setImgOk] = useState(true);

  return (
    <section className="border-t border-[#E5DFC6] bg-[#f7f3ea] py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6 md:px-10">
        <span
          className="text-[12px] font-medium uppercase tracking-[0.24em] text-[#8a7136]"
          style={inter}
        >
          Why we built Goldsainte
        </span>

        <blockquote className="mt-6">
          <p className="font-secondary text-[22px] leading-[1.5] text-[#0a2225] md:text-[28px] md:leading-[1.5]">
            &ldquo;Travel discovery already happens on social — what&rsquo;s been
            missing is everything after the inspiration. We built Goldsainte so
            the person who inspired your trip can actually design it, lead it, and
            earn from it — and so the person you trust with your journey is
            exactly who you pay, on a marketplace that stands behind every
            specialist.&rdquo;
          </p>
        </blockquote>

        <div className="mt-10 flex items-center gap-4">
          {imgOk ? (
            <img
              src={founderPhoto}
              alt="Andre Powell, Founder & CEO of Goldsainte"
              loading="lazy"
              onError={() => setImgOk(false)}
              className="h-14 w-14 flex-none rounded-full object-cover"
              style={{ objectPosition: "center 20%" }}
            />
          ) : (
            <span className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-[#C7A962] font-secondary text-[18px] text-[#0a2225]">
              AP
            </span>
          )}
          <div>
            <p className="text-[17px] font-medium text-[#0a2225]" style={inter}>
              Andre Powell
            </p>
            <p className="text-[15px] text-[#0a2225]/55" style={inter}>
              Founder &amp; CEO, Goldsainte
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FounderNote;
