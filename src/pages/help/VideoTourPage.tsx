import { Link } from "react-router-dom";
import { ArrowLeft, Play } from "lucide-react";

export default function VideoTourPage() {
  return (
    <main className="flex-1 bg-[#FDF9F0]">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12 md:py-20 text-center">
        <Link to="/help" className="inline-flex items-center gap-1.5 text-sm text-[#0c4d47] hover:underline mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Help Center
        </Link>

        <div className="mx-auto h-14 w-14 rounded-full bg-white border border-[#E5DFC6] flex items-center justify-center mb-6">
          <Play className="h-6 w-6 text-[#0c4d47]" />
        </div>
        <p className="text-xs uppercase tracking-[0.2em] text-[#C7A962] font-medium mb-4">Video Tour</p>
        <h1 className="font-secondary text-3xl md:text-4xl text-[#0a2225] mb-4">Coming soon</h1>
        <p className="text-base text-[#4A4A4A] leading-relaxed mb-8">
          We're producing a 90-second walkthrough of Goldsainte. Sign up for our newsletter to be notified when it's live.
        </p>
        <Link
          to="/corporate-contact"
          className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47] hover:bg-[#0a3e3a] text-white font-medium px-6 py-3 text-sm transition-colors"
        >
          Notify me
        </Link>
      </div>
    </main>
  );
}