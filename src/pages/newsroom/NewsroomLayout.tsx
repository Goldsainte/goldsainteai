import { Outlet, NavLink } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const navItems = [
  { to: "/newsroom", label: "Newsroom", end: true },
  { to: "/newsroom/archive", label: "Archive" },
  { to: "/newsroom/media-kit", label: "Media Kit" },
  { to: "/newsroom/company-facts", label: "Company Facts" },
  { to: "/newsroom/leadership", label: "Leadership" },
  { to: "/newsroom/editorial-policy", label: "Editorial Policy" },
  { to: "/newsroom/press-contact", label: "Press Contact" },
];

export default function NewsroomLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FDF9F0] text-[#0a2225]">
      <Header />
      <div className="border-b border-[#E5DFC6] bg-[#FDF9F0]/95 backdrop-blur sticky top-14 sm:top-16 md:top-20 z-20">
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
          <NavLink
            to="/newsroom"
            end
            className="text-[10px] tracking-[0.25em] uppercase text-[#0c4d47] font-medium"
          >
            Newsroom
          </NavLink>
          <nav className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
            {navItems.slice(1).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `tracking-wide uppercase transition-colors ${
                    isActive
                      ? "text-[#0c4d47] font-semibold"
                      : "text-[#0a2225]/60 hover:text-[#0a2225]"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
