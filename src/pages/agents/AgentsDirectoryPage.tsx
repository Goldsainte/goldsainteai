import PartnerDirectory from "@/components/partner/PartnerDirectory";

// Thin wrapper — the directory lives in the shared PartnerDirectory (Jul 16).
export default function AgentsDirectoryPage() {
  return <PartnerDirectory kind="agent" />;
}
