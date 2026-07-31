/* AdminUserLookupPage (30 Jul) — the per-person ledger the review-panel
 * search couldn't be: type any name, phone, or email and see EVERYTHING that
 * person is and has done on the platform — traveler, creator, agent; tips in
 * and out; trip requests; proposals; bookings on both sides; guide/bundle
 * purchases; earnings. Data comes from the admin-gated admin-user-lookup
 * edge function (service role), so no per-table RLS gaps.
 * Route: /admin/user-lookup */
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, User, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { edgeErrorMessage } from '@/lib/edgeErrorMessage';

const money = (cents: number | null | undefined, currency = 'usd') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() })
    .format((Number(cents) || 0) / 100);

const when = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

/* Generic row renderer: shows the fields that exist without assuming a
 * schema — id tail, status, date, and the first title-ish/amount-ish field. */
const pickTitle = (r: any) =>
  r.title ?? r.destination ?? r.trip_title ?? r.name ?? r.note ?? null;
const pickAmount = (r: any) =>
  r.amount_cents ?? r.amount ?? r.amount_paid ?? r.total_cents ?? null;

const RowList = ({ rows, empty }: { rows: any[]; empty: string }) => {
  if (!rows?.length) return <p className="text-sm text-[#6B7280]">{empty}</p>;
  return (
    <div className="divide-y divide-[#E5DFC6]">
      {rows.map((r) => (
        <div key={r.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
          <div className="min-w-0">
            <p className="truncate text-[#0a2225]">
              {pickTitle(r) || `#${String(r.id).replace(/-/g, '').slice(0, 8).toUpperCase()}`}
            </p>
            <p className="text-xs text-[#6B7280]">
              {when(r.created_at)}
              {r.status ? ` · ${String(r.status).replace(/_/g, ' ')}` : ''}
              {r.payment_status ? ` · ${String(r.payment_status).replace(/_/g, ' ')}` : ''}
            </p>
          </div>
          {pickAmount(r) !== null && (
            <span className="shrink-0 font-medium text-[#0a2225]">{money(pickAmount(r), r.currency)}</span>
          )}
        </div>
      ))}
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-[#E5DFC6] bg-white p-5">
    <h3 className="mb-3 font-secondary text-lg text-[#0a2225]">{title}</h3>
    {children}
  </div>
);

export default function AdminUserLookupPage() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [selected, setSelected] = useState<any>(null);

  const runSearch = async () => {
    if (query.trim().length < 2) return;
    setSearching(true);
    setDetail(null);
    setSelected(null);
    try {
      const { data, error } = await supabase.functions.invoke('admin-user-lookup', {
        body: { query: query.trim() },
      });
      if (error) throw new Error(await edgeErrorMessage(error, 'Search failed'));
      if (data?.error) throw new Error(data.error);
      setResults(data?.results ?? []);
      if (!(data?.results ?? []).length) toast.info('No people matched that search');
    } catch (e: any) {
      toast.error(e.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const openUser = async (person: any) => {
    setSelected(person);
    setLoadingDetail(true);
    setDetail(null);
    try {
      const { data, error } = await supabase.functions.invoke('admin-user-lookup', {
        body: { userId: person.id },
      });
      if (error) throw new Error(await edgeErrorMessage(error, 'Lookup failed'));
      if (data?.error) throw new Error(data.error);
      setDetail(data);
    } catch (e: any) {
      toast.error(e.message || 'Lookup failed');
    } finally {
      setLoadingDetail(false);
    }
  };

  const p = detail?.profile;

  return (
    <div className="min-h-screen bg-[#FDF9F0] px-3 py-10 sm:px-4">
      <div className="mx-auto w-full max-w-5xl">
        <p className="text-[12px] uppercase tracking-[0.28em] text-[#8D6B2F]">Admin</p>
        <h1 className="mt-2 font-secondary text-3xl text-[#0a2225] md:text-4xl">User Lookup</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#6B7280]">
          Search anyone on the platform by name, phone, or email — travelers, creators, and agents —
          and see their complete activity and money movement in one place.
        </p>

        <div className="mt-6 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
              placeholder="Name, phone, or email…"
              className="pl-11 sm:pl-11 rounded-xl border-[#E5DFC6] bg-white focus:border-[#C7A962] focus:ring-[#C7A962]"
            />
          </div>
          <Button onClick={runSearch} disabled={searching} className="rounded-xl bg-[#0c4d47] px-6 text-[#E5DFC6] hover:bg-[#073331]">
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
          </Button>
        </div>

        {results.length > 0 && !detail && !loadingDetail && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-[#E5DFC6] bg-white">
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => openUser(r)}
                className="flex w-full items-center justify-between gap-4 border-b border-[#E5DFC6] px-5 py-3.5 text-left transition-colors last:border-b-0 hover:bg-[#F5EFE1]"
              >
                <div>
                  <p className="text-sm font-medium text-[#0a2225]">
                    {r.full_name || `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim() || r.username || r.email}
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    {r.email}{r.phone ? ` · ${r.phone}` : ''} · joined {when(r.created_at)}
                  </p>
                </div>
                <span className="text-xs uppercase tracking-wide text-[#8D6B2F]">
                  {r.account_type || r.role || 'traveler'}
                </span>
              </button>
            ))}
          </div>
        )}

        {loadingDetail && (
          <p className="mt-8 flex items-center gap-2 text-sm text-[#6B7280]">
            <Loader2 className="h-4 w-4 animate-spin" /> Assembling {selected?.full_name || 'their'} ledger…
          </p>
        )}

        {detail && p && (
          <div className="mt-8 space-y-5">
            {/* Identity */}
            <div className="rounded-2xl border border-[#E5DFC6] bg-white p-6">
              <div className="flex flex-wrap items-center gap-3">
                <User className="h-5 w-5 text-[#C7A962]" />
                <h2 className="font-secondary text-2xl text-[#0a2225]">
                  {p.full_name || `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || p.username}
                </h2>
                {detail.agent && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#0c4d47]/10 px-3 py-1 text-xs text-[#0c4d47]">
                    <ShieldCheck className="h-3.5 w-3.5" /> Agent · {detail.agent.agency_name} · {detail.agent.status}
                    {detail.agent.terms_accepted ? '' : ' · terms pending'}
                  </span>
                )}
                {detail.isCreator && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#C7A962]/15 px-3 py-1 text-xs text-[#8D6B2F]">
                    <Sparkles className="h-3.5 w-3.5" /> Creator
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-[#6B7280]">
                {p.email}{p.phone ? ` · ${p.phone}` : ''} · joined {when(p.created_at)} · id {String(p.id).slice(0, 8)}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                <div><p className="text-xs uppercase tracking-wide text-[#6B7280]">Tips received (net)</p>
                  <p className="mt-0.5 font-secondary text-xl text-[#0a2225]">{money(detail.tips.receivedNetCents)}</p></div>
                <div><p className="text-xs uppercase tracking-wide text-[#6B7280]">Tips given</p>
                  <p className="mt-0.5 font-secondary text-xl text-[#0a2225]">{money(detail.tips.givenCents)}</p></div>
                <div><p className="text-xs uppercase tracking-wide text-[#6B7280]">Earnings (ledger)</p>
                  <p className="mt-0.5 font-secondary text-xl text-[#0a2225]">{money(detail.earnings.totalCents)}</p></div>
                <div><p className="text-xs uppercase tracking-wide text-[#6B7280]">Bookings (all sides)</p>
                  <p className="mt-0.5 font-secondary text-xl text-[#0a2225]">
                    {detail.bookings.asTraveler.length + detail.bookings.asAgent.length + detail.bookings.asCreator.length}
                  </p></div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Section title={`Agent Applications (${(detail.applications ?? []).length})`}>
                {(detail.applications ?? []).length === 0 ? (
                  <p className="text-sm text-[#6B7280]">
                    No application on file — this person selected the agent path at signup
                    but has not completed the Documents step of the application.
                  </p>
                ) : (
                  <div className="divide-y divide-[#E5DFC6]">
                    {(detail.applications ?? []).map((a: any) => (
                      <div key={a.id} className="py-2.5 text-sm">
                        <p className="text-[#0a2225]">
                          {a.agency_name || 'Unnamed agency'} · <span className="capitalize">{String(a.status || '').replace(/_/g, ' ')}</span>
                        </p>
                        <p className="text-xs text-[#6B7280]">
                          Ref GS-{String(a.id).replace(/-/g, '').slice(0, 8).toUpperCase()} · filed {when(a.created_at)}
                          {a.stripe_verification_status ? ` · identity ${a.stripe_verification_status}` : ' · identity not started'}
                          {a.rejected_at ? ` · rejected ${when(a.rejected_at)}` : ''}
                        </p>
                        {a.rejection_reason && (
                          <p className="mt-1 text-xs italic text-[#6B7280]">"{a.rejection_reason}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Section>
              <Section title={`Trip Requests (${detail.tripRequests.length})`}>
                <RowList rows={detail.tripRequests} empty="No trip requests." />
              </Section>
              <Section title={`Proposals Sent (${detail.proposals.length})`}>
                <RowList rows={detail.proposals} empty="No proposals sent." />
              </Section>
              <Section title={`Bookings as Traveler (${detail.bookings.asTraveler.length})`}>
                <RowList rows={detail.bookings.asTraveler} empty="No bookings as a traveler." />
              </Section>
              <Section title={`Bookings Serviced (${detail.bookings.asAgent.length + detail.bookings.asCreator.length})`}>
                <RowList rows={[...detail.bookings.asAgent, ...detail.bookings.asCreator]} empty="No bookings serviced." />
              </Section>
              <Section title={`Tips Received (${detail.tips.received.length}) — ${money(detail.tips.receivedGrossCents)} gross / ${money(detail.tips.receivedNetCents)} net`}>
                <RowList rows={detail.tips.received} empty="No tips received." />
              </Section>
              <Section title={`Tips Given (${detail.tips.given.length}) — ${money(detail.tips.givenCents)}`}>
                <RowList rows={detail.tips.given} empty="No tips given." />
              </Section>
              <Section title={`Guide & Bundle Purchases (${detail.purchases.guides.length + detail.purchases.bundles.length})`}>
                <RowList rows={[...detail.purchases.guides, ...detail.purchases.bundles]} empty="No purchases." />
              </Section>
              <Section title={`Earnings Ledger (${detail.earnings.entries.length}) — ${money(detail.earnings.totalCents)}`}>
                <RowList rows={detail.earnings.entries} empty="No earnings entries." />
              </Section>
            </div>

            <p className="text-xs text-[#6B7280]">
              Each section shows the most recent {detail.limits?.perSection ?? 25} entries.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
