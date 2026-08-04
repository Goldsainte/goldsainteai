import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Hash, PenLine, Copy } from "lucide-react";
import { toast } from "sonner";

type Product = { id: string; title: string; description?: string | null; destination?: string | null; kind: "trip" | "guide" };

export function CreatorContentToolsTab() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const [t, g] = await Promise.all([
        supabase
          .from("packaged_trips")
          .select("id, title, description, destination")
          .eq("creator_id", user.id),
        supabase
          .from("itinerary_products")
          .select("id, title, description, destination")
          .eq("creator_id", user.id),
      ]);
      const merged: Product[] = [
        ...((t.data as any[]) || []).map((x) => ({ ...x, kind: "trip" as const })),
        ...((g.data as any[]) || []).map((x) => ({ ...x, kind: "guide" as const })),
      ];
      setProducts(merged);
    })();
  }, [user?.id]);

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-2">
        <h2 className="font-secondary text-xl text-[#0a2225]">{t("dash.c.contentTools", "Content tools")}</h2>
      </div>
      <p className="text-[16px] text-[#6B7280]">
        {t("dash.c.contentToolsSub", "AI-generated copy to help you market your trips. Powered by Goldsainte AI.")}
      </p>

      <CaptionGenerator products={products} />
      <HashtagSuggester />
      <DescriptionRewriter products={products} />
    </div>
  );
}

function ResultBlock({ items }: { items: string[] }) {
  const { t: tr } = useTranslation();
  return (
    <div className="mt-4 space-y-2">
      {items.map((t, i) => (
        <div key={i} className="flex items-start justify-between gap-3 rounded-xl border border-[#E5DFC6] bg-[#FDF9F0] p-3">
          <p className="whitespace-pre-wrap text-[16px] text-[#0a2225]">{t}</p>
          <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(t).then(() => toast.success(tr("dash.c.copied", "Copied")))}>
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}

function CaptionGenerator({ products }: { products: Product[] }) {
  const { t } = useTranslation();
  const [productId, setProductId] = useState<string>("");
  const [vibe, setVibe] = useState("Inspirational");
  const [platform, setPlatform] = useState("Instagram");
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function run() {
    const p = products.find((x) => x.id === productId);
    if (!p) return toast.error(t("dash.c.selectTripGuide", "Select a trip or guide"));
    setLoading(true);
    setResults([]);
    const { data, error } = await supabase.functions.invoke("ai-content-tools", {
      body: { tool: "caption", title: p.title, destination: p.destination, vibe, platform },
    });
    setLoading(false);
    if (error || (data as any)?.error) return toast.error(t("dash.c.captionsFailed", "Could not generate captions"));
    setResults(((data as any).captions || []).slice(0, 3));
  }

  return (
    <div className="border-t border-[#0a2225]/15 pt-6">
      <div className="mb-3 flex items-center gap-2">
        <PenLine className="h-4 w-4 text-[#0c4d47]" />
        <h3 className="font-secondary text-lg text-[#0a2225]">{t("dash.c.captionGenerator", "Caption generator")}</h3>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Select value={productId} onValueChange={setProductId}>
          <SelectTrigger><SelectValue placeholder={t("dash.c.selectTripGuide", "Select a trip or guide")} /></SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={vibe} onValueChange={setVibe}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {["Funny", "Inspirational", "Direct"].map((v) => <SelectItem key={v} value={v}>{t(`dash.c.vibe${v}`, v)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {["TikTok", "Instagram", "Twitter"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={run} disabled={loading} className="mt-3 bg-[#0c4d47]">
        {loading ? t("dash.c.generating", "Generating…") : t("dash.c.gen3Captions", "Generate 3 captions")}
      </Button>
      {results.length > 0 && <ResultBlock items={results} />}
    </div>
  );
}

function HashtagSuggester() {
  const { t } = useTranslation();
  const [destination, setDestination] = useState("");
  const [tripType, setTripType] = useState("");
  const [groups, setGroups] = useState<{ broad: string[]; medium: string[]; niche: string[] } | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!destination.trim()) return toast.error(t("dash.c.addDestination", "Add a destination"));
    setLoading(true);
    setGroups(null);
    const { data, error } = await supabase.functions.invoke("ai-content-tools", {
      body: { tool: "hashtags", destination, tripType },
    });
    setLoading(false);
    if (error || (data as any)?.error) return toast.error(t("dash.c.hashtagsFailed", "Could not generate hashtags"));
    setGroups(data as any);
  }

  return (
    <div className="border-t border-[#0a2225]/15 pt-6">
      <div className="mb-3 flex items-center gap-2">
        <Hash className="h-4 w-4 text-[#0c4d47]" />
        <h3 className="font-secondary text-lg text-[#0a2225]">{t("dash.c.hashtagSuggester", "Hashtag suggester")}</h3>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder={t("dash.c.destPh", "Destination (e.g. Tokyo)")} />
        <Input value={tripType} onChange={(e) => setTripType(e.target.value)} placeholder={t("dash.c.tripTypePh", "Trip type (food, adventure…)")} />
      </div>
      <Button onClick={run} disabled={loading} className="mt-3 bg-[#0c4d47]">
        {loading ? t("dash.c.thinking", "Thinking…") : t("dash.c.suggest15", "Suggest 15 hashtags")}
      </Button>
      {groups && (
        <div className="mt-4 space-y-3">
          {(["broad", "medium", "niche"] as const).map((g) => (
            <div key={g}>
              <p className="mb-1 text-[14px] uppercase tracking-wider text-[#7A7151]">{g} reach</p>
              <div className="flex flex-wrap gap-2">
                {(groups[g] || []).map((h) => (
                  <button
                    key={h}
                    onClick={() => navigator.clipboard.writeText(h).then(() => toast.success(t("dash.c.copied", "Copied")))}
                    className="rounded-full bg-[#FDF9F0] px-3 py-1 text-[15px] text-[#0c4d47] ring-1 ring-[#E5DFC6] hover:bg-white"
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DescriptionRewriter({ products }: { products: Product[] }) {
  const { t } = useTranslation();
  const [productId, setProductId] = useState("");
  const [tone, setTone] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const product = products.find((p) => p.id === productId);

  async function run() {
    if (!product?.description) return toast.error(t("dash.c.selectProductDesc", "Select a product with a description"));
    if (!tone.trim()) return toast.error(t("dash.c.describeTone", "Describe the desired tone"));
    setLoading(true);
    setResults([]);
    const { data, error } = await supabase.functions.invoke("ai-content-tools", {
      body: { tool: "rewrite", description: product.description, tone },
    });
    setLoading(false);
    if (error || (data as any)?.error) return toast.error(t("dash.c.rewriteFailed", "Could not rewrite"));
    setResults(((data as any).versions || []).slice(0, 3));
  }

  return (
    <div className="border-t border-[#0a2225]/15 pt-6">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="font-secondary text-lg text-[#0a2225]">{t("dash.c.descriptionRewriter", "Description rewriter")}</h3>
      </div>
      <Select value={productId} onValueChange={setProductId}>
        <SelectTrigger><SelectValue placeholder={t("dash.c.selectTripGuide", "Select a trip or guide")} /></SelectTrigger>
        <SelectContent>
          {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
        </SelectContent>
      </Select>
      {product?.description && (
        <Textarea readOnly value={product.description} className="mt-3 bg-[#FDF9F0]" />
      )}
      <Input
        value={tone}
        onChange={(e) => setTone(e.target.value)}
        placeholder={t("dash.c.tonePh", 'Tone (e.g. "luxurious editorial", "punchy & playful")')}
        className="mt-3"
      />
      <Button onClick={run} disabled={loading} className="mt-3 bg-[#0c4d47]">
        {loading ? t("dash.c.rewriting", "Rewriting…") : t("dash.c.gen3Versions", "Generate 3 versions")}
      </Button>
      {results.length > 0 && <ResultBlock items={results} />}
    </div>
  );
}
