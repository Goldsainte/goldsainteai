import jsPDF from "jspdf";

export function generateArchitecturePDF() {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a3" });
  const pageW = doc.internal.pageSize.getWidth();
  
  // Colors
  const teal = [10, 34, 37] as const;
  const darkGreen = [20, 80, 60] as const;
  const blue = [30, 60, 120] as const;
  const purple = [100, 40, 120] as const;
  const gold = [180, 140, 40] as const;
  const gray = [80, 80, 80] as const;
  const lightBg = [245, 245, 240] as const;

  // Title
  doc.setFillColor(...lightBg);
  doc.rect(0, 0, pageW, 297, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...teal);
  doc.text("Goldsainte Platform — High-Level Architecture", pageW / 2, 18, { align: "center" });
  
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, pageW / 2, 25, { align: "center" });

  // Helper: draw a rounded box with title and bullet items
  const drawBox = (
    x: number, y: number, w: number, h: number,
    title: string, items: string[],
    fillColor: readonly [number, number, number],
    textWhite = true
  ) => {
    doc.setFillColor(...fillColor);
    doc.roundedRect(x, y, w, h, 3, 3, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(textWhite ? 255 : 30, textWhite ? 255 : 30, textWhite ? 255 : 30);
    doc.text(title, x + w / 2, y + 8, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(textWhite ? 230 : 50, textWhite ? 230 : 50, textWhite ? 230 : 50);
    items.forEach((item, i) => {
      doc.text(`• ${item}`, x + 4, y + 15 + i * 5);
    });
  };

  // Column headers
  const colHeaders = ["USERS", "WEB APPLICATION", "BACKEND (LOVABLE CLOUD)", "EXTERNAL SERVICES"];
  const colX = [10, 85, 160, 310];
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...gray);
  colHeaders.forEach((h, i) => {
    doc.text(h, colX[i] + 2, 35);
    doc.setDrawColor(200, 200, 200);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(colX[i], 38, colX[i], 260);
  });
  doc.setLineDashPattern([], 0);

  // === USERS column ===
  drawBox(12, 42, 65, 45, "Traveller", [
    "Browses packages",
    "Submits trip requests",
    "Reviews quotations",
    "Selects & pays",
    "Voice AI concierge"
  ], darkGreen);

  drawBox(12, 95, 65, 40, "Travel Agent", [
    "Creates packages",
    "Builds quotations",
    "Manages requests",
    "Tracks payments"
  ], darkGreen);

  drawBox(12, 143, 65, 40, "Creator", [
    "Publishes packages",
    "Earns commissions",
    "Manages storyboards",
    "Affiliate links"
  ], darkGreen);

  drawBox(12, 191, 65, 40, "Platform Admin", [
    "Manages users & agents",
    "Monitors platform",
    "Configures settings",
    "Dispute resolution"
  ], darkGreen);

  // === WEB APP column ===
  drawBox(87, 42, 65, 55, "goldsainte.com", [
    "React 18 + Vite",
    "TypeScript",
    "Tailwind CSS + shadcn/ui",
    "React Router SPA",
    "Zustand state mgmt",
    "TanStack React Query",
    "Framer Motion"
  ], teal);

  drawBox(87, 105, 65, 45, "Key Modules", [
    "Marketplace & Trip Requests",
    "Booking & Payment Flows",
    "Creator Dashboard",
    "Agent CRM Workspace",
    "Admin Panel",
    "Voice AI Concierge"
  ], [40, 90, 70]);

  drawBox(87, 158, 65, 35, "Frontend Services", [
    "Stripe.js integration",
    "Mapbox GL / Google Maps",
    "i18next localisation",
    "Sentry error tracking"
  ], [40, 90, 70]);

  // === BACKEND column ===
  drawBox(162, 42, 65, 35, "Auth & Identity", [
    "Email / Password",
    "Google OAuth",
    "Apple Sign-In",
    "JWT Sessions"
  ], blue);

  drawBox(162, 83, 65, 50, "PostgreSQL Database", [
    "Profiles & Companies",
    "Packages & Bookings",
    "Trip Requests & Proposals",
    "Payments & Escrow",
    "Notifications & Reviews",
    "RLS on all tables"
  ], blue);

  drawBox(162, 139, 65, 50, "Edge Functions", [
    "stripe-webhook-handler",
    "process-escrow-payout",
    "create-marketplace-lead",
    "sync-calendar-google",
    "sync-calendar-outlook",
    "purchase-template-usage",
    "record-terms-acceptance"
  ], blue);

  drawBox(162, 195, 65, 30, "Realtime & Storage", [
    "Notification subscriptions",
    "Chat / booking updates",
    "File storage (proposals, docs)"
  ], blue);

  drawBox(235, 42, 65, 40, "Supabase Config", [
    "PostgREST API",
    "Service Role Key (server)",
    "Anon Key (client)",
    "Row-Level Security",
    "Database triggers"
  ], [50, 70, 100]);

  drawBox(235, 88, 65, 35, "Database Functions", [
    "purchase_template_usage",
    "Webhook idempotency",
    "Activity logging",
    "Escrow management"
  ], [50, 70, 100]);

  // === EXTERNAL column ===
  drawBox(312, 42, 65, 45, "Stripe", [
    "Payment processing",
    "Stripe Connect payouts",
    "Webhook events",
    "Escrow management",
    "Group split payments"
  ], purple);

  drawBox(312, 93, 65, 40, "OpenAI", [
    "GPT-4o model",
    "Voice AI Concierge",
    "Itinerary generation",
    "AI Travel Assistant"
  ], purple);

  drawBox(312, 139, 65, 30, "Google Maps", [
    "Destination search",
    "Location display",
    "Geocoding"
  ], purple);

  drawBox(312, 175, 65, 25, "Sentry", [
    "Error tracking",
    "Performance monitoring"
  ], purple);

  drawBox(312, 206, 65, 25, "Email Service", [
    "Transactional emails",
    "Payment reminders"
  ], purple);

  // === Arrows (simplified) ===
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.5);
  doc.setLineDashPattern([], 0);
  
  // Users → Web App
  const arrowY = [60, 112, 160, 208];
  arrowY.forEach(y => {
    doc.line(77, y, 87, y);
    doc.setFillColor(100, 100, 100);
    doc.triangle(87, y - 1.5, 87, y + 1.5, 89, y, "F");
  });

  // Web App → Backend
  [55, 95, 150, 205].forEach(y => {
    doc.line(152, y, 162, y);
    doc.setFillColor(100, 100, 100);
    doc.triangle(162, y - 1.5, 162, y + 1.5, 164, y, "F");
  });

  // Backend → External
  [60, 110, 150, 185].forEach(y => {
    doc.line(300, y, 312, y);
    doc.setFillColor(100, 100, 100);
    doc.triangle(312, y - 1.5, 312, y + 1.5, 314, y, "F");
  });

  // Labels on arrows
  doc.setFontSize(6);
  doc.setTextColor(...gray);
  doc.text("HTTPS", 78, 57);
  doc.text("PostgREST", 153, 52);
  doc.text("invoke", 153, 92);
  doc.text("subscribe", 153, 147);
  doc.text("payments", 302, 57);
  doc.text("AI calls", 302, 107);

  // Legend
  const ly = 248;
  doc.setFillColor(240, 240, 235);
  doc.roundedRect(10, ly, pageW - 20, 15, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...teal);
  doc.text("Legend:", 15, ly + 6);
  
  doc.setFont("helvetica", "normal");
  doc.setLineWidth(0.5);
  doc.setDrawColor(100, 100, 100);
  doc.line(35, ly + 5, 50, ly + 5);
  doc.text("Active data flow", 52, ly + 6);
  
  doc.setFillColor(...darkGreen);
  doc.roundedRect(95, ly + 2, 8, 5, 1, 1, "F");
  doc.text("Users", 105, ly + 6);

  doc.setFillColor(...blue);
  doc.roundedRect(125, ly + 2, 8, 5, 1, 1, "F");
  doc.text("Backend", 135, ly + 6);

  doc.setFillColor(...purple);
  doc.roundedRect(160, ly + 2, 8, 5, 1, 1, "F");
  doc.text("External Services", 170, ly + 6);

  doc.text("Tech Stack: React 18 · Vite · TypeScript · Tailwind CSS · Supabase (PostgreSQL + Auth + Edge Functions + Realtime + Storage) · Stripe · OpenAI GPT-4o", 15, ly + 12);

  doc.save("Goldsainte_Architecture_Diagram.pdf");
}
