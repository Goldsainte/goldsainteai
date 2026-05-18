import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BASE_URL } from "./lib";

const schema = z.object({
  reporter_name: z.string().trim().min(1).max(120),
  publication: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  topic: z.string().min(1),
  deadline: z.string().min(1),
  message: z.string().trim().min(10).max(4000),
});

const TOPICS = [
  "General",
  "Founder Interview",
  "Speaking Request",
  "Podcast",
  "Broadcast",
  "Product Demo",
  "Industry Comment",
];

export default function PressContact() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const parsed = schema.safeParse({
      reporter_name: fd.get("reporter_name"),
      publication: fd.get("publication"),
      email: fd.get("email"),
      phone: fd.get("phone") || "",
      topic: fd.get("topic"),
      deadline: fd.get("deadline"),
      message: fd.get("message"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const id = crypto.randomUUID();
    const insert = { id, ...parsed.data, phone: parsed.data.phone || null };
    const { error } = await (supabase as any).from("press_inquiries").insert(insert);
    if (error) {
      setSubmitting(false);
      toast.error("Could not submit. Please email press@goldsainte.com.");
      return;
    }
    // Notify the press team — non-blocking on failure
    try {
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "press-inquiry-received",
          recipientEmail: "press@goldsainte.com",
          idempotencyKey: `press-inquiry-${id}`,
          templateData: {
            reporter_name: parsed.data.reporter_name,
            publication: parsed.data.publication,
            email: parsed.data.email,
            phone: parsed.data.phone || "",
            topic: parsed.data.topic,
            deadline: parsed.data.deadline,
            message: parsed.data.message,
          },
        },
      });
    } catch {
      // Inquiry is saved; email delivery will retry via the queue
    }
    setSubmitting(false);
    setDone(true);
    form.reset();
  }

  return (
    <>
      <Helmet>
        <title>Press Contact | Goldsainte Newsroom</title>
        <meta name="description" content="Submit press inquiries to Goldsainte: interviews, demos, industry comment, and more." />
        <link rel="canonical" href={`${BASE_URL}/newsroom/press-contact`} />
      </Helmet>
      <div className="max-w-5xl mx-auto px-5 sm:px-6 py-8 sm:py-10 md:py-16">
        <div className="grid gap-8 md:gap-12 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-start">
          <div className="md:sticky md:top-[calc(var(--header-height,64px)+88px)] space-y-5">
            <div>
              <p className="mb-3 text-[10px] uppercase tracking-[0.24em] text-[#C7A962]">Press Contact</p>
              <h1 className="font-secondary text-[28px] sm:text-[34px] md:text-[40px] leading-[1.02] mb-4">Press Contact</h1>
            </div>
            <p className="text-[15px] leading-[1.75] text-[#0a2225]/72">
          For interview requests, demos, or industry commentary, submit the form below or email{" "}
          <a href="mailto:press@goldsainte.com" className="text-[#0c4d47] underline">press@goldsainte.com</a>.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-sm border border-[#E5DFC6] bg-white px-4 py-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#0a2225]/48">Response</p>
                <p className="mt-2 font-secondary text-xl text-[#0a2225]">1 business day</p>
              </div>
              <div className="rounded-sm border border-[#E5DFC6] bg-white px-4 py-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#0a2225]/48">Best for</p>
                <p className="mt-2 font-secondary text-xl text-[#0a2225]">Press + broadcast</p>
              </div>
            </div>
          </div>

          {done ? (
            <div className="border border-[#0c4d47] p-6 sm:p-8 bg-white rounded-sm">
              <p className="font-secondary text-xl md:text-2xl mb-2">Thank you.</p>
              <p className="text-[#0a2225]/70">A member of our team will reply within one business day.</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5 rounded-sm border border-[#E5DFC6] bg-white p-5 sm:p-6 md:p-8">
              <div className="grid gap-5 md:grid-cols-2">
                <Field name="reporter_name" label="Reporter name" required />
                <Field name="publication" label="Publication" required />
                <Field name="email" label="Email" type="email" required />
                <Field name="phone" label="Phone (optional)" />
                <div>
                  <label className="text-[10px] uppercase tracking-[0.22em] text-[#0a2225]/60">Inquiry topic *</label>
                  <select name="topic" required defaultValue=""
                    className="mt-2 w-full rounded-sm border border-[#E5DFC6] bg-white px-4 py-3 text-sm text-[#0a2225] focus:outline-none focus:ring-2 focus:ring-[#0c4d47]/25 focus:border-[#0c4d47] transition">
                    <option value="" disabled>Select…</option>
                    {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <Field name="deadline" label="Deadline" type="date" required />
                  <p className="mt-2 text-[11px] leading-relaxed text-[#0a2225]/52">Include the publication deadline for priority response handling.</p>
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.22em] text-[#0a2225]/60">Message *</label>
                <textarea name="message" required rows={7}
                  className="mt-2 w-full rounded-sm border border-[#E5DFC6] bg-white px-4 py-3 text-sm text-[#0a2225] focus:outline-none focus:ring-2 focus:ring-[#0c4d47]/25 focus:border-[#0c4d47] transition" />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-6 py-3 rounded-sm bg-[#0c4d47] text-white text-[11px] uppercase tracking-[0.2em] hover:bg-[#0a3d39] disabled:opacity-50 transition"
              >
                {submitting ? "Submitting…" : "Submit inquiry"}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

function Field({ name, label, type = "text", required }: { name: string; label: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-[0.22em] text-[#0a2225]/60">
        {label} {required && <span className="text-[#0c4d47]">*</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        className="mt-2 w-full rounded-sm border border-[#E5DFC6] bg-white px-4 py-3 text-sm text-[#0a2225] focus:outline-none focus:ring-2 focus:ring-[#0c4d47]/25 focus:border-[#0c4d47] transition"
      />
    </div>
  );
}