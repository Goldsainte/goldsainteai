import React, { useEffect, useMemo, useState } from "react";
import { MarketplaceShell } from "@/components/marketplace/MarketplaceShell";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";
import { BackButton } from "@/components/ui/BackButton";

type AgentRow = Database["public"]["Tables"]["travel_agents"]["Row"];

type Agent = {
  id: string;
  displayName: string;
  agencyName: string | null;
  avatarUrl: string | null;
  baseCity: string | null;
  baseCountry: string | null;
  languages: string[];
  destinations: string[];
  specialties: string[];
  minBudget: number | null;
  maxBudget: number | null;
  yearsExperience: number | null;
  rating: number | null;
  totalReviews: number | null;
};

type AgentFilters = {
  search: string;
  destination?: string;
  specialty?: string;
  language?: string;
  minRating?: number;
  minBudget?: number;
  maxBudget?: number;
};

const defaultFilters: AgentFilters = { search: "" };

function sanitizeStringArray(value?: (string | null)[] | null): string[] {
  if (!value) {
    return [];
  }
  return value
    .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    .map((entry) => entry.trim());
}

function splitLocation(value: string | null): { city: string | null; country: string | null } {
  if (!value) {
    return { city: null, country: null };
  }
  const parts = value.split(",");
  const city = parts[0]?.trim() || null;
  const country = parts.slice(1).join(",").trim() || null;
  return { city, country };
}

function mapAgent(row: AgentRow): Agent {
  const location = splitLocation(row.business_address);
  const destinations = sanitizeStringArray(row.destinations);
  const destinationFallback = sanitizeStringArray(row.regions);
  const specialties = sanitizeStringArray(row.specializations);
  const specialtyFallback = sanitizeStringArray(row.service_types);
  return {
    id: row.id,
    displayName: row.primary_contact_name || row.agency_name || "Travel agent",
    agencyName: row.agency_name,
    avatarUrl: row.profile_image_url,
    baseCity: location.city,
    baseCountry: location.country,
    languages: sanitizeStringArray(row.languages),
    destinations: destinations.length ? destinations : destinationFallback,
    specialties: specialties.length ? specialties : specialtyFallback,
    minBudget: row.min_budget,
    maxBudget: row.max_budget,
    yearsExperience: row.experience_years,
    rating: row.rating,
    totalReviews: row.total_reviews,
  };
}

export default function BrowseAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AgentFilters>(defaultFilters);
  const [sortBy, setSortBy] = useState<"rating" | "bookings" | "experience">(
    "rating"
  );
  const navigate = useNavigate();

  useEffect(() => {
    async function loadAgents() {
      setLoading(true);
      const { data, error } = await supabase
        .from("travel_agents")
        .select(
          `
            id,
            agency_name,
            profile_image_url,
            business_address,
            regions,
            destinations,
            specializations,
            service_types,
            languages,
            min_budget,
            max_budget,
            experience_years,
            rating,
            total_reviews,
            primary_contact_name
          `
        );

      if (!error && data) {
        setAgents(data.map(mapAgent));
      }
      setLoading(false);
    }

    loadAgents();
  }, []);

  const filteredAgents = useMemo(() => {
    let result = [...agents];
    const search = filters.search.trim().toLowerCase();

    if (search) {
      result = result.filter((agent) => {
        const name = agent.displayName.toLowerCase();
        const agency = (agent.agencyName || "").toLowerCase();
        const city = (agent.baseCity || "").toLowerCase();
        const country = (agent.baseCountry || "").toLowerCase();
        const destinations = agent.destinations.join(" ").toLowerCase();
        const specialties = agent.specialties.join(" ").toLowerCase();
        return (
          name.includes(search) ||
          agency.includes(search) ||
          city.includes(search) ||
          country.includes(search) ||
          destinations.includes(search) ||
          specialties.includes(search)
        );
      });
    }

    if (filters.destination) {
      const needle = filters.destination.toLowerCase();
      result = result.filter((agent) =>
        agent.destinations.some((dest) => dest.toLowerCase().includes(needle))
      );
    }

    if (filters.specialty) {
      const needle = filters.specialty.toLowerCase();
      result = result.filter((agent) =>
        agent.specialties.some((spec) => spec.toLowerCase().includes(needle))
      );
    }

    if (filters.language) {
      const needle = filters.language.toLowerCase();
      result = result.filter((agent) =>
        agent.languages.some((lang) => lang.toLowerCase().includes(needle))
      );
    }

    if (filters.minRating != null) {
      result = result.filter(
        (agent) => agent.rating != null && agent.rating >= filters.minRating!
      );
    }

    if (filters.minBudget != null) {
      result = result.filter(
        (agent) => agent.minBudget != null && agent.minBudget >= filters.minBudget!
      );
    }

    if (filters.maxBudget != null) {
      result = result.filter(
        (agent) => agent.maxBudget != null && agent.maxBudget <= filters.maxBudget!
      );
    }

    if (sortBy === "rating") {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "bookings") {
      result.sort((a, b) => (b.totalReviews || 0) - (a.totalReviews || 0));
    } else if (sortBy === "experience") {
      result.sort((a, b) => (b.yearsExperience || 0) - (a.yearsExperience || 0));
    }

    return result;
  }, [agents, filters, sortBy]);

  const sortControl = (
    <select
      className="rounded-full border border-[#E5DFC6] bg-white px-4 py-2 text-xs text-[#0a2225] focus:outline-none focus:ring-2 focus:ring-[#C7A962]/50"
      value={sortBy}
      onChange={(event) =>
        setSortBy(event.target.value as "rating" | "bookings" | "experience")
      }
    >
      <option value="rating">Sort by rating</option>
      <option value="bookings">Sort by completed trips</option>
      <option value="experience">Sort by experience</option>
    </select>
  );

  const filtersPanel = (
    <div className="space-y-5 text-xs">
      <div className="space-y-2">
        <label className="text-[11px] font-medium uppercase tracking-wider text-[#0a2225]/70">
          Destination focus
        </label>
        <input
          type="text"
          placeholder="e.g. Italy, Maldives"
          className="w-full rounded-xl border border-[#E5DFC6] bg-white px-3 py-2 text-xs text-[#0a2225] placeholder:text-[#0a2225]/40 focus:outline-none focus:ring-2 focus:ring-[#C7A962]/50"
          value={filters.destination ?? ""}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, destination: event.target.value }))
          }
        />
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-medium uppercase tracking-wider text-[#0a2225]/70">Specialty</label>
        <input
          type="text"
          placeholder="Honeymoons, family, safari..."
          className="w-full rounded-xl border border-[#E5DFC6] bg-white px-3 py-2 text-xs text-[#0a2225] placeholder:text-[#0a2225]/40 focus:outline-none focus:ring-2 focus:ring-[#C7A962]/50"
          value={filters.specialty ?? ""}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, specialty: event.target.value }))
          }
        />
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-medium uppercase tracking-wider text-[#0a2225]/70">Language</label>
        <input
          type="text"
          placeholder="e.g. English"
          className="w-full rounded-xl border border-[#E5DFC6] bg-white px-3 py-2 text-xs text-[#0a2225] placeholder:text-[#0a2225]/40 focus:outline-none focus:ring-2 focus:ring-[#C7A962]/50"
          value={filters.language ?? ""}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, language: event.target.value }))
          }
        />
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-medium uppercase tracking-wider text-[#0a2225]/70">Min rating</label>
        <input
          type="number"
          min={1}
          max={5}
          step={0.1}
          placeholder="e.g. 4.5"
          className="w-full rounded-xl border border-[#E5DFC6] bg-white px-3 py-2 text-xs text-[#0a2225] placeholder:text-[#0a2225]/40 focus:outline-none focus:ring-2 focus:ring-[#C7A962]/50"
          value={filters.minRating ?? ""}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              minRating: event.target.value ? Number(event.target.value) : undefined,
            }))
          }
        />
      </div>

      <div className="space-y-2">
        <div className="text-[11px] font-medium uppercase tracking-wider text-[#0a2225]/70">
          Typical trip budget
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            className="w-1/2 rounded-xl border border-[#E5DFC6] bg-white px-3 py-2 text-xs text-[#0a2225] placeholder:text-[#0a2225]/40 focus:outline-none focus:ring-2 focus:ring-[#C7A962]/50"
            value={filters.minBudget ?? ""}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                minBudget: event.target.value ? Number(event.target.value) : undefined,
              }))
            }
          />
          <input
            type="number"
            placeholder="Max"
            className="w-1/2 rounded-xl border border-[#E5DFC6] bg-white px-3 py-2 text-xs text-[#0a2225] placeholder:text-[#0a2225]/40 focus:outline-none focus:ring-2 focus:ring-[#C7A962]/50"
            value={filters.maxBudget ?? ""}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                maxBudget: event.target.value ? Number(event.target.value) : undefined,
              }))
            }
          />
        </div>
      </div>

      <button
        type="button"
        className="mt-3 w-full rounded-full border border-[#E5DFC6] bg-white px-4 py-2 text-[11px] font-medium text-[#0a2225] transition hover:bg-[#f7f3ea]"
        onClick={() => setFilters({ ...defaultFilters })}
      >
        Clear filters
      </button>
    </div>
  );

  const headerRight = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <input
        type="text"
        placeholder="Search agents by destination, specialty, or agency"
        className="w-full rounded-full border border-[#E5DFC6] bg-white px-4 py-2.5 text-xs text-[#0a2225] placeholder:text-[#0a2225]/40 focus:outline-none focus:ring-2 focus:ring-[#C7A962]/50 sm:w-72"
        value={filters.search}
        onChange={(event) =>
          setFilters((prev) => ({ ...prev, search: event.target.value }))
        }
      />
      <button
        type="button"
        className="rounded-full border border-[#E5DFC6] bg-white px-4 py-2.5 text-xs font-medium text-[#0a2225] transition hover:bg-[#f7f3ea]"
        onClick={() => navigate("/post-trip")}
      >
        Post a trip brief
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f7f3ea] flex-1">
      <div className="container max-w-6xl px-4 pt-4">
        <BackButton label="Back" />
      </div>
      <MarketplaceShell
        title="Browse Verified Travel Agents"
        subtitle="Discover verified travel agents who specialize in your dream destinations. Every agent is vetted for quality and expertise."
        filters={filtersPanel}
        headerRight={headerRight}
        resultCount={filteredAgents.length}
        sortControl={sortControl}
      >
      {loading ? (
        <div className="py-10 text-sm text-[#0a2225]/60">Loading travel agents…</div>
      ) : filteredAgents.length === 0 ? (
        <div className="py-10 text-sm text-[#0a2225]/60">
          No agents match these filters yet. Try widening your search.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map((agent) => (
            <button
              key={agent.id}
              type="button"
              onClick={() => navigate(`/agent/${agent.id}`)}
              className="group flex flex-col justify-between rounded-2xl border border-[#E5DFC6] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-[#E5DFC6] bg-[#f7f3ea]">
                  {agent.avatarUrl ? (
                    <img
                      src={agent.avatarUrl}
                      alt={agent.displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[#0a2225]/60">
                      {agent.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-secondary text-base font-semibold text-[#0a2225]">
                    {agent.displayName}
                  </div>
                  <div className="truncate text-[12px] text-[#0a2225]/60">
                    {agent.agencyName || "Independent agent"}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
                {(agent.baseCity || agent.baseCountry) && (
                  <span className="rounded-full bg-[#f7f3ea] px-3 py-1 text-[#0a2225]">
                    {[agent.baseCity, agent.baseCountry].filter(Boolean).join(", ")}
                  </span>
                )}
                {agent.rating != null && (
                  <span className="rounded-full bg-[#f7f3ea] px-3 py-1 text-[#0a2225]">
                    <span className="text-[#C7A962]">★</span> {agent.rating.toFixed(1)}
                  </span>
                )}
                {agent.totalReviews != null && agent.totalReviews > 0 && (
                  <span className="rounded-full bg-[#f7f3ea] px-3 py-1 text-[#0a2225]">
                    {agent.totalReviews} reviews
                  </span>
                )}
                {agent.yearsExperience != null && (
                  <span className="rounded-full bg-[#f7f3ea] px-3 py-1 text-[#0a2225]">
                    {agent.yearsExperience}+ yrs
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {agent.specialties.slice(0, 3).map((spec) => (
                  <span
                    key={spec}
                    className="rounded-full bg-[#C7A962]/10 px-2.5 py-1 text-[10px] font-medium text-[#0a2225]"
                  >
                    {spec}
                  </span>
                ))}
              </div>

              {agent.languages.length > 0 && (
                <div className="mt-3 text-[11px] text-[#0a2225]/50">
                  Languages: {agent.languages.join(", ")}
                </div>
              )}

              <div className="mt-4 flex w-full items-center justify-center rounded-full bg-[#0c4d47] px-4 py-2 text-xs font-semibold text-white transition group-hover:bg-[#0a3d39]">
                View profile
              </div>
            </button>
          ))}
        </div>
      )}
      </MarketplaceShell>
    </div>
  );
}
