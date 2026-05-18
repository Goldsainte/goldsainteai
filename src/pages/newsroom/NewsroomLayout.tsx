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
    <div className="bg-[#FDF9F0] text-[#0a2225]">
      <div
        className="border-b border-[#E5DFC6] bg-[#FDF9F0]/95 backdrop-blur sticky z-20 shadow-[0_1px_0_rgba(10,34,37,0.04)]"
        style={{ top: "var(--header-height)" }}
      >
        <nav
          className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-x-5 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden text-xs"
          aria-label="Newsroom sections"
        >
          {navItems.slice(1).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `tracking-wide uppercase transition-colors shrink-0 ${
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
      <Outlet />
    </div>
  );
}
