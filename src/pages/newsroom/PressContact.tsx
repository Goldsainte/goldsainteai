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

const TOPICS = ["General", "Founder Interview", "Product Demo", "Industry Comment"];

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
      <div className="max-w-2xl mx-auto px-5 sm:px-6 py-12 md:py-20">
        <h1 className="font-primary text-3xl md:text-4xl mb-4">Press Contact</h1>
        <p className="text-[#0a2225]/70 mb-8 md:mb-10">
          For interview requests, demos, or industry commentary, submit the form below or email{" "}
          <a href="mailto:press@goldsainte.com" className="text-[#0c4d47] underline">press@goldsainte.com</a>.
        </p>

        {done ? (
          <div className="border border-[#0c4d47] p-8 bg-white">
            <p className="font-primary text-xl md:text-2xl mb-2">Thank you.</p>
            <p className="text-[#0a2225]/70">A member of our team will reply within one business day.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5">
            <Field name="reporter_name" label="Reporter name" required />
            <Field name="publication" label="Publication" required />
            <Field name="email" label="Email" type="email" required />
            <Field name="phone" label="Phone (optional)" />
            <div>
              <label className="text-xs uppercase tracking-wider text-[#0a2225]/70">Inquiry topic *</label>
              <select name="topic" required defaultValue=""
                className="mt-2 w-full rounded-xl border border-[#E5DFC6] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c4d47]/30 focus:border-[#0c4d47]">
                <option value="" disabled>Select…</option>
                {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <Field name="deadline" label="Deadline" type="date" required />
            <div>
              <label className="text-xs uppercase tracking-wider text-[#0a2225]/70">Message *</label>
              <textarea name="message" required rows={6}
                className="mt-2 w-full rounded-xl border border-[#E5DFC6] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c4d47]/30 focus:border-[#0c4d47]" />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 rounded-full bg-[#0c4d47] text-white text-sm tracking-wide hover:bg-[#0a3d39] disabled:opacity-50 transition"
            >
              {submitting ? "Submitting…" : "Submit inquiry"}
            </button>
          </form>
        )}
      </div>
    </>
  );
}

function Field({ name, label, type = "text", required }: { name: string; label: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-[#0a2225]/70">
        {label} {required && "*"}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        className="mt-2 w-full rounded-xl border border-[#E5DFC6] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c4d47]/30 focus:border-[#0c4d47]"
      />
    </div>
  );
}