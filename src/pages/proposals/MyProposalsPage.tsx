import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Clock, MapPin, Calendar, FileText } from "lucide-react";
import { getMyProposals, type MyProposalListItem } from "@/services/proposalsService";
import { ProposalStatusBadge } from "@/components/proposals/ProposalStatusBadge";
import { BackButton } from "@/components/ui/BackButton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "sent", label: "Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "withdrawn", label: "Withdrawn" },
  { value: "expired", label: "Expired" },
] as const;

function formatMoney(amount: number | null | undefined, currency = "USD") {
  if (!amount) return "—";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(0)}`;
  }
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function ProposalCard({ proposal }: { proposal: MyProposalListItem }) {
  const navigate = useNavigate();
  const destination = proposal.trip_destination || "Flexible destination";
  const tripTitle = proposal.trip_title || destination;
  const dates = proposal.trip_start_date
    ? `${formatDate(proposal.trip_start_date)}${proposal.trip_end_date ? ` – ${formatDate(proposal.trip_end_date)}` : ""}`
    : null;

  return (
    <button
      type="button"
      onClick={() => navigate(`/proposals/${proposal.id}`)}
      className="w-full text-left bg-card rounded-2xl shadow-sm border border-border hover:border-primary/40 p-5 md:p-6 transition-all group"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-base font-semibold text-foreground truncate">
              {proposal.headline || "Trip Proposal"}
            </p>
            <ProposalStatusBadge status={proposal.status as any} />
          </div>

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{tripTitle}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {dates && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {dates}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Sent {formatDate(proposal.created_at)}
            </span>
            {proposal.valid_until && (
              <span className="inline-flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Valid until {formatDate(proposal.valid_until)}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end gap-1.5">
          <p className="font-secondary text-2xl font-semibold text-foreground">
            {formatMoney(proposal.price_from, proposal.currency || "USD")}
          </p>
          {proposal.nights && (
            <span className="text-xs text-muted-foreground">{proposal.nights} night{proposal.nights !== 1 ? "s" : ""}</span>
          )}
          <span className="inline-flex items-center gap-1.5 text-sm text-primary font-medium group-hover:gap-2 transition-all">
            View details
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </button>
  );
}

function EmptyState({ tab }: { tab: string }) {
  const message = tab === "all"
    ? "You haven't submitted any proposals yet."
    : `No ${tab} proposals.`;

  return (
    <div className="text-center py-16">
      <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
      <p className="font-secondary text-xl text-foreground mb-2">{message}</p>
      <p className="text-sm text-muted-foreground">
        {tab === "all"
          ? "Browse trip requests in the marketplace and submit your first proposal."
          : "Proposals with this status will appear here."}
      </p>
    </div>
  );
}

export default function MyProposalsPage() {
  const [proposals, setProposals] = useState<MyProposalListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getMyProposals();
        if (!cancelled) setProposals(data);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load proposals.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = activeTab === "all"
    ? proposals
    : proposals.filter(p => p.status === activeTab);

  const counts = proposals.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">Loading your proposals…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="bg-muted/30 border-b border-border">
        <div className="mx-auto max-w-5xl px-4 pt-10 pb-8 md:pt-14 md:pb-10">
          <BackButton label="Back" className="mb-6" />

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-primary font-medium">
              Proposal Management
            </p>
            <h1 className="font-secondary text-2xl md:text-[28px] leading-tight text-foreground">
              My Proposals
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              All proposals you've submitted across trips. Track status, follow up, and manage your pipeline.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-5xl px-4 py-8 md:py-10">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            {STATUS_TABS.map(tab => {
              const count = tab.value === "all" ? proposals.length : (counts[tab.value] || 0);
              return (
                <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
                  {tab.label}
                  {count > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 min-w-[18px]">
                      {count}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {STATUS_TABS.map(tab => (
            <TabsContent key={tab.value} value={tab.value}>
              {(tab.value === "all" ? proposals : proposals.filter(p => p.status === tab.value)).length === 0 ? (
                <EmptyState tab={tab.value} />
              ) : (
                <div className="space-y-3">
                  {(tab.value === "all" ? proposals : proposals.filter(p => p.status === tab.value)).map(p => (
                    <ProposalCard key={p.id} proposal={p} />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </section>
    </main>
  );
}
