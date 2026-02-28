import { Link } from "react-router-dom";

export function CreatorSettingsTab() {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E5DFC6] rounded-2xl p-8 md:p-12 text-center">
        <h2 className="font-secondary text-2xl text-[#0a2225] mb-2">Creator Settings</h2>
        <p className="text-sm text-[#6B7280] max-w-md mx-auto mb-6">
          Manage your creator profile, payout preferences, and account settings.
        </p>
        <Link
          to="/travel-settings"
          className="inline-flex items-center gap-2 rounded-full border border-[#E5DFC6] bg-white px-6 py-3 text-sm font-medium text-[#0a2225] hover:bg-[#F6F0E4] transition-colors"
        >
          Go to Settings
        </Link>
      </div>
    </div>
  );
}
