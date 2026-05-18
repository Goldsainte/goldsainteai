import { Outlet, NavLink } from "react-router-dom";

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
    <div className="min-h-screen flex flex-col bg-[#f7f3ea] text-[#0a2225]">
      <div className="border-b border-[#0a2225]/10 bg-[#f7f3ea] sticky top-0 z-30 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="text-[10px] tracking-[0.25em] uppercase text-[#0c4d47] font-medium">
            Goldsainte Newsroom
          </span>
          <nav className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `tracking-wide uppercase ${
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
    </div>
  );
}