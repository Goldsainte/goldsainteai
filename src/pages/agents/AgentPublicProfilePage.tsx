// src/pages/agents/AgentPublicProfilePage.tsx
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, MapPin, ArrowRight } from "lucide-react";

export default function AgentPublicProfilePage() {
  const { id } = useParams();
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAgent() {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          id,
          full_name,
          avatar_url,
          bio,
          specialties,
          agent_verification_status,
          tiktok_handle,
          instagram_handle,
          location,
          featured_photos
        `
        )
        .eq("id", id)
        .maybeSingle();

      setAgent(data);
      setLoading(false);
    }

    loadAgent();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f3ea] p-8">
        <p className="text-[12px]">Loading agent...</p>
      </main>
    );
  }

  if (!agent) {
    return (
      <main className="min-h-screen bg-[#f7f3ea] p-8">
        <p className="text-[12px]">Agent not found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#0a2225]">
      {/* HERO */}
      <section className="relative h-[340px] w-full overflow-hidden rounded-b-3xl">
        <img
          src={
            agent.featured_photos?.[0] ||
            "/images/default-agent-hero.jpg"
          }
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />

        <div className="absolute bottom-6 left-6 text-white">
          <h1 className="font-display text-[32px] mb-1">{agent.full_name}</h1>
          <div className="flex items-center gap-2 text-[12px]">
            {agent.agent_verification_status === "verified" && (
              <span className="inline-flex items-center gap-1 bg-[#0c4d47] rounded-full px-2 py-1 text-[10px] text-[#E5DFC6]">
                <CheckCircle2 className="h-3 w-3" /> Verified Agent
              </span>
            )}
            {agent.location && (
              <span className="flex items-center gap-1 text-[11px]">
                <MapPin className="h-3 w-3" /> {agent.location}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        {/* Bio */}
        <div className="mb-8 max-w-2xl">
          <p className="text-[12px] leading-relaxed text-[#4a4a4a]">
            {agent.bio ||
              "This agent hasn't added a bio yet, but their trips speak for themselves."}
          </p>
        </div>

        {/* Specialties */}
        {agent.specialties?.length > 0 && (
          <div className="mb-10">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#8D8D8D] mb-2">
              Specialties
            </p>

            <div className="flex flex-wrap gap-2">
              {agent.specialties.map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-full bg-[#E5DFC6] text-[#0a2225] text-[11px] px-3 py-1"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Social */}
        <div className="mb-12">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#8D8D8D] mb-2">
            Social
          </p>

          <div className="flex flex-col gap-1 text-[12px]">
            {agent.tiktok_handle && (
              <a
                href={`https://www.tiktok.com/@${agent.tiktok_handle}`}
                target="_blank"
                className="underline underline-offset-2"
              >
                TikTok @{agent.tiktok_handle}
              </a>
            )}

            {agent.instagram_handle && (
              <a
                href={`https://www.instagram.com/${agent.instagram_handle}`}
                target="_blank"
                className="underline underline-offset-2"
              >
                Instagram @{agent.instagram_handle}
              </a>
            )}
          </div>
        </div>

        {/* Pinterest-style photo wall */}
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#8D8D8D] mb-4">
            Storyboard Preview
          </p>

          <div className="columns-2 md:columns-3 gap-3 space-y-3">
            {(agent.featured_photos || []).map((src: string) => (
              <img
                key={src}
                src={src}
                className="w-full rounded-2xl object-cover"
              />
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12">
          <a
            href={`/post-trip?agentId=${agent.id}`}
            className="inline-flex items-center gap-2 rounded-full bg-[#0c4d47] text-[#E5DFC6] px-6 py-3 text-[12px] hover:bg-[#073331]"
          >
            Request a trip from {agent.full_name}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>
    </main>
  );
}
