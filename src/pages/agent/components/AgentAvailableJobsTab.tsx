import { MapPin, DollarSign, Clock } from "lucide-react";
import { toast } from "sonner";

interface AgentAvailableJobsTabProps {
  jobs: any[];
  isVerified: boolean;
  onSelectJob: (job: any) => void;
}

export function AgentAvailableJobsTab({ jobs, isVerified, onSelectJob }: AgentAvailableJobsTabProps) {
  if (jobs.length === 0) {
    return (
      <div className="bg-white border border-[#E5DFC6] rounded-2xl p-12 text-center">
        <h3 className="font-secondary text-2xl text-[#0a2225] mb-2">No trip requests available</h3>
        <p className="text-sm text-[#6B7280]">Check back later for new opportunities.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <div key={job.id} className="bg-white border border-[#E5DFC6] rounded-2xl p-6 transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between mb-4">
            <div className="pr-4">
              <h3 className="font-secondary text-xl text-[#0a2225] mb-1">{job.title}</h3>
              <p className="text-sm text-[#6B7280]">{job.description}</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-[#FDF9F0] border border-[#E5DFC6] px-3 py-1 text-xs text-[#0a2225] whitespace-nowrap">
              {job.booking_type}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6 text-sm text-[#0a2225]">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#0c4d47]" />
              <span>{job.destination}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-[#0c4d47]" />
              <span>${job.budget_min} – ${job.budget_max}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#0c4d47]" />
              <span>{new Date(job.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <button
            onClick={() => {
              if (!isVerified) {
                toast.error("Your application must be approved before you can place bids");
                return;
              }
              onSelectJob(job);
            }}
            disabled={!isVerified}
            className="w-full rounded-full bg-[#0c4d47] px-6 py-3 text-sm font-medium text-[#E5DFC6] hover:bg-[#0a3d39] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerified ? "Submit Proposal" : "Awaiting Approval"}
          </button>
        </div>
      ))}
    </div>
  );
}