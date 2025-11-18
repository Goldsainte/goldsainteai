import { Helmet } from "react-helmet-async";
import { AlertTriangle } from "lucide-react";

export default function AdminMarketplaceOversightPage() {
  return (
    <>
      <Helmet>
        <title>Marketplace Oversight · Admin · Goldsainte</title>
      </Helmet>

      <div className="flex min-h-screen items-center justify-center bg-[#f7f3ea] px-4">
        <div className="max-w-md rounded-2xl border border-[#E5DFC6]/30 bg-white p-8 text-center shadow-sm">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-[#FBF9F0] p-3">
              <AlertTriangle className="h-8 w-8 text-[#BFAD72]" />
            </div>
          </div>
          <h1 className="mb-2 font-display text-2xl text-[#0a2225]">
            Page Temporarily Disabled
          </h1>
          <p className="text-sm leading-relaxed text-[#4a4a4a]">
            This admin page requires database migrations to support booking_milestones,
            cancellation_policies, and other marketplace oversight features.
          </p>
        </div>
      </div>
    </>
  );
}
