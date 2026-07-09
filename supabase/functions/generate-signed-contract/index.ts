// generate-signed-contract — renders a trip_contracts row as a downloadable
// PDF. Auth: caller must be a party to the contract (agent, traveler, or
// creator). Returns { pdf_base64, filename }.
// Self-contained (no _shared imports) for dashboard-paste deploys.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  PDFDocument,
  StandardFonts,
  rgb,
} from "https://esm.sh/pdf-lib@1.17.1";

const STATIC_ALLOWED = new Set<string>([
  "https://goldsainte.ai",
  "https://www.goldsainte.ai",
  "https://goldsainte.com",
  "https://www.goldsainte.com",
  "https://goldsainteai.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:3000",
]);
const ALLOWED_HOST_RE =
  /^https:\/\/[a-z0-9-]+\.(lovable\.app|lovableproject\.com)$/i;

function resolveAllowedOrigin(req?: Request): string {
  const origin = req?.headers.get("origin") ?? "";
  if (
    STATIC_ALLOWED.has(origin) ||
    ALLOWED_HOST_RE.test(origin) ||
    (Deno.env.get("ALLOWED_ORIGIN") && origin === Deno.env.get("ALLOWED_ORIGIN"))
  ) {
    return origin;
  }
  return Deno.env.get("ALLOWED_ORIGIN") ?? "https://goldsainte.ai";
}

function corsHeaders(req?: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    Vary: "Origin",
  };
}

function jsonResponse(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

const FOREST = rgb(0.047, 0.302, 0.278); // #0c4d47
const GOLD = rgb(0.553, 0.42, 0.184); // #8D6B2F
const INK = rgb(0.039, 0.133, 0.145); // #0a2225
const FAINT = rgb(0.45, 0.45, 0.45);

function humanize(name: string): string {
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

function fmtDate(v: unknown): string {
  if (!v) return "";
  const d = new Date(String(v));
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function dataUrlToBytes(dataUrl: string): Uint8Array | null {
  const m = /^data:image\/(png|jpe?g);base64,(.+)$/i.exec(dataUrl.trim());
  if (!m) return null;
  try {
    const bin = atob(m[2]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse(req, { error: "Unauthorized" }, 401);
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
        Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const authed = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims, error: ce } = await authed.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    const uid = claims?.claims?.sub as string | undefined;
    if (ce || !uid) {
      return jsonResponse(req, { error: "Unauthorized" }, 401);
    }

    const { contractId } = await req.json();
    if (!contractId) {
      return jsonResponse(req, { error: "contractId is required" }, 400);
    }

    const { data: contract, error: cErr } = await supabase
      .from("trip_contracts")
      .select("*")
      .eq("id", contractId)
      .single();
    if (cErr || !contract) {
      return jsonResponse(req, { error: "Contract not found" }, 404);
    }

    // Party check — agent, traveler, or creator only.
    const parties = [
      contract.agent_id,
      contract.traveler_id,
      contract.creator_id,
    ].filter(Boolean);
    if (!parties.includes(uid)) {
      return jsonResponse(req, { error: "Forbidden" }, 403);
    }

    // Agent display name for the signature block.
    let agentName = "Agent";
    try {
      const { data: agentProfile } = await supabase
        .from("profiles")
        .select("full_name, display_name")
        .eq("id", contract.agent_id)
        .maybeSingle();
      agentName =
        agentProfile?.full_name || agentProfile?.display_name || "Agent";
    } catch (_) {
      /* non-fatal */
    }

    const travelerInfo = (contract.traveler_info ?? {}) as Record<string, string>;
    const tripInfo = (contract.trip_info ?? {}) as Record<string, unknown>;
    const fieldValues = (contract.field_values ?? {}) as Record<string, string>;
    const sections = Array.isArray(contract.contract_sections)
      ? (contract.contract_sections as Array<{
          id: string;
          title: string;
          content: string;
          fields?: { name: string; value: string }[];
        }>)
      : [];

    // ── Uploaded contracts: load the original and append a certificate ──
    if ((contract as any).source_type === "uploaded" && (contract as any).uploaded_pdf_path) {
      const { data: fileData, error: dlErr } = await supabase.storage
        .from("contracts")
        .download((contract as any).uploaded_pdf_path);
      if (dlErr || !fileData) {
        return jsonResponse(req, { error: "Could not load the uploaded contract file" }, 500);
      }
      const originalBytes = new Uint8Array(await fileData.arrayBuffer());
      const doc = await PDFDocument.load(originalBytes, { ignoreEncryption: true });
      const certFont = await doc.embedFont(StandardFonts.Helvetica);
      const certBold = await doc.embedFont(StandardFonts.HelveticaBold);
      const certPage = doc.addPage([612, 792]);
      let cy = 792 - 64;
      certPage.drawText("G O L D S A I N T E", { x: 56, y: cy, size: 12, font: certBold, color: GOLD });
      cy -= 28;
      certPage.drawText("Signature Certificate", { x: 56, y: cy, size: 18, font: certBold, color: INK });
      cy -= 18;
      certPage.drawText(
        `Appended to the agent-provided agreement · Contract ${String(contract.id).slice(0, 8).toUpperCase()}`,
        { x: 56, y: cy, size: 9, font: certFont, color: FAINT },
      );
      cy -= 34;
      const certSigners: Array<{ label: string; sig: string | null; at: string | null }> = [
        { label: "Agent", sig: contract.agent_signature, at: contract.agent_signed_at },
        { label: "Traveler", sig: contract.traveler_signature, at: contract.traveler_signed_at },
      ];
      if (contract.creator_id) {
        certSigners.push({ label: "Creator", sig: contract.creator_signature, at: contract.creator_signed_at });
      }
      for (const s of certSigners) {
        certPage.drawText(s.label, { x: 56, y: cy, size: 11, font: certBold, color: INK });
        cy -= 10;
        let drew = false;
        if (s.sig && s.sig.startsWith("data:image")) {
          const b = dataUrlToBytes(s.sig);
          if (b) {
            try {
              const img = /jpe?g/i.test(s.sig.slice(0, 24)) ? await doc.embedJpg(b) : await doc.embedPng(b);
              const h = 44;
              const w = Math.min(img.width * (h / img.height), 220);
              certPage.drawImage(img, { x: 56, y: cy - h, width: w, height: h });
              cy -= h + 6;
              drew = true;
            } catch (_) {
              /* fall through */
            }
          }
        }
        if (!drew) {
          certPage.drawText(s.sig ? "[signed electronically]" : "[not yet signed]", {
            x: 56, y: cy - 12, size: 10, font: certFont, color: s.sig ? INK : FAINT,
          });
          cy -= 22;
        }
        certPage.drawLine({ start: { x: 56, y: cy }, end: { x: 286, y: cy }, thickness: 0.7, color: rgb(0.6, 0.6, 0.6) });
        cy -= 14;
        certPage.drawText(s.at ? `Signed ${fmtDate(s.at)}` : "Pending signature", { x: 56, y: cy, size: 8.5, font: certFont, color: FAINT });
        cy -= 34;
      }
      certPage.drawText(
        `Generated by Goldsainte · ${new Date().toLocaleString("en-US")} · Contract ID ${contract.id}`,
        { x: 56, y: 48, size: 7.5, font: certFont, color: FAINT },
      );
      const mergedBytes = await doc.save();
      let mb = "";
      const CH = 8192;
      for (let i = 0; i < mergedBytes.length; i += CH) {
        mb += String.fromCharCode(...mergedBytes.subarray(i, i + CH));
      }
      const upDest = String(tripInfo.destination ?? "").replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 40);
      return jsonResponse(req, {
        pdf_base64: btoa(mb),
        filename: `Goldsainte-Contract${upDest ? `-${upDest}` : ""}-${String(contract.id).slice(0, 8)}.pdf`,
      });
    }

    // ── Build the PDF ──
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);

    const PAGE_W = 612; // Letter
    const PAGE_H = 792;
    const M = 56;
    const CONTENT_W = PAGE_W - M * 2;

    let page = pdf.addPage([PAGE_W, PAGE_H]);
    let y = PAGE_H - M;

    const ensureSpace = (needed: number) => {
      if (y - needed < M + 24) {
        page = pdf.addPage([PAGE_W, PAGE_H]);
        y = PAGE_H - M;
      }
    };

    const wrap = (text: string, f: typeof font, size: number, width: number) => {
      const words = String(text ?? "").split(/\s+/).filter(Boolean);
      const lines: string[] = [];
      let line = "";
      for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (f.widthOfTextAtSize(test, size) > width && line) {
          lines.push(line);
          line = w;
        } else {
          line = test;
        }
      }
      if (line) lines.push(line);
      return lines.length ? lines : [""];
    };

    const drawText = (
      text: string,
      opts: { f?: typeof font; size?: number; color?: ReturnType<typeof rgb>; gap?: number; x?: number; width?: number } = {},
    ) => {
      const f = opts.f ?? font;
      const size = opts.size ?? 10.5;
      const color = opts.color ?? INK;
      const width = opts.width ?? CONTENT_W;
      const x = opts.x ?? M;
      const lineH = size * 1.45;
      for (const line of wrap(text, f, size, width)) {
        ensureSpace(lineH);
        page.drawText(line, { x, y: y - size, size, font: f, color });
        y -= lineH;
      }
      y -= opts.gap ?? 0;
    };

    const hr = (gap = 14) => {
      ensureSpace(gap + 2);
      page.drawLine({
        start: { x: M, y },
        end: { x: PAGE_W - M, y },
        thickness: 0.7,
        color: rgb(0.85, 0.82, 0.72),
      });
      y -= gap;
    };

    // Header
    page.drawText("G O L D S A I N T E", {
      x: M,
      y: y - 12,
      size: 12,
      font: bold,
      color: GOLD,
    });
    y -= 30;
    drawText("Trip Services Contract", { f: bold, size: 20, color: INK, gap: 2 });
    drawText(
      `Contract ${String(contract.id).slice(0, 8).toUpperCase()} · Status: ${String(contract.status).replace(/_/g, " ")}`,
      { size: 9, color: FAINT, gap: 6 },
    );
    hr();

    // Parties + trip summary
    const travelerName =
      `${travelerInfo.firstName ?? ""} ${travelerInfo.lastName ?? ""}`.trim() ||
      "Traveler";
    drawText("PARTIES", { f: bold, size: 9, color: GOLD, gap: 2 });
    drawText(`Traveler: ${travelerName}${travelerInfo.email ? `  ·  ${travelerInfo.email}` : ""}`, { gap: 0 });
    drawText(`Agent: ${agentName}`, { gap: 8 });

    drawText("TRIP", { f: bold, size: 9, color: GOLD, gap: 2 });
    const tripBits: string[] = [];
    if (tripInfo.destination) tripBits.push(String(tripInfo.destination));
    if (tripInfo.startDate || tripInfo.endDate) {
      tripBits.push(
        `${fmtDate(tripInfo.startDate)}${tripInfo.endDate ? ` – ${fmtDate(tripInfo.endDate)}` : ""}`,
      );
    }
    if (tripInfo.duration) tripBits.push(`${tripInfo.duration} days`);
    if (fieldValues.totalCost || tripInfo.totalCost) {
      tripBits.push(`Total: $${fieldValues.totalCost ?? tripInfo.totalCost}`);
    }
    drawText(tripBits.join("   ·   ") || "—", { gap: 10 });
    hr();

    // Sections
    sections.forEach((section, i) => {
      ensureSpace(40);
      drawText(`${i + 1}. ${section.title}`, {
        f: bold,
        size: 12,
        color: FOREST,
        gap: 3,
      });
      if (section.content) {
        drawText(section.content, { size: 10.5, gap: 4 });
      }
      for (const field of section.fields ?? []) {
        const value = fieldValues[field.name] ?? field.value ?? "";
        if (!value) continue;
        drawText(`${humanize(field.name)}:`, {
          f: bold,
          size: 9.5,
          color: FAINT,
          gap: 0,
        });
        drawText(String(value), { size: 10.5, gap: 4, x: M + 12, width: CONTENT_W - 12 });
      }
      y -= 8;
    });

    hr();

    // Signatures
    ensureSpace(140);
    drawText("SIGNATURES", { f: bold, size: 9, color: GOLD, gap: 8 });

    const signers: Array<{
      label: string;
      name: string;
      sig: string | null;
      at: string | null;
    }> = [
      {
        label: "Agent",
        name: agentName,
        sig: contract.agent_signature,
        at: contract.agent_signed_at,
      },
      {
        label: "Traveler",
        name: travelerName,
        sig: contract.traveler_signature,
        at: contract.traveler_signed_at,
      },
    ];
    if (contract.creator_id) {
      signers.push({
        label: "Creator",
        name: "Creator",
        sig: contract.creator_signature,
        at: contract.creator_signed_at,
      });
    }

    for (const s of signers) {
      ensureSpace(96);
      drawText(`${s.label} — ${s.name}`, { f: bold, size: 10, gap: 4 });
      let drewImage = false;
      if (s.sig && s.sig.startsWith("data:image")) {
        const bytes = dataUrlToBytes(s.sig);
        if (bytes) {
          try {
            const img = /jpe?g/i.test(s.sig.slice(0, 24))
              ? await pdf.embedJpg(bytes)
              : await pdf.embedPng(bytes);
            const targetH = 44;
            const scale = targetH / img.height;
            const targetW = Math.min(img.width * scale, 220);
            ensureSpace(targetH + 20);
            page.drawImage(img, {
              x: M,
              y: y - targetH,
              width: targetW,
              height: targetH,
            });
            y -= targetH + 4;
            drewImage = true;
          } catch (_) {
            /* fall through to text */
          }
        }
      }
      if (!drewImage) {
        drawText(s.sig ? "[signed electronically]" : "[not yet signed]", {
          f: italic,
          size: 10,
          color: s.sig ? INK : FAINT,
          gap: 2,
        });
      }
      page.drawLine({
        start: { x: M, y },
        end: { x: M + 230, y },
        thickness: 0.7,
        color: rgb(0.6, 0.6, 0.6),
      });
      y -= 12;
      drawText(s.at ? `Signed ${fmtDate(s.at)}` : "Pending signature", {
        size: 8.5,
        color: FAINT,
        gap: 12,
      });
    }

    // Footer
    ensureSpace(30);
    drawText(
      `Generated by Goldsainte · ${new Date().toLocaleString("en-US")} · Contract ID ${contract.id}`,
      { size: 7.5, color: FAINT },
    );

    const bytes = await pdf.save();
    let bin = "";
    const chunk = 8192;
    for (let i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    const pdf_base64 = btoa(bin);

    const destSlug = String(tripInfo.destination ?? "")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
    const filename = `Goldsainte-Contract${destSlug ? `-${destSlug}` : ""}-${String(contract.id).slice(0, 8)}.pdf`;

    return jsonResponse(req, { pdf_base64, filename });
  } catch (e) {
    console.error("generate-signed-contract error", e);
    return jsonResponse(req, { error: String((e as Error)?.message ?? e) }, 500);
  }
});
