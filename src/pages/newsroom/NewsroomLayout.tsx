import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { to: "/newsroom/archive", label: "Archive" },
  { to: "/newsroom/media-kit", label: "Media Kit" },
  { to: "/newsroom/company-facts", label: "Company Facts" },
  { to: "/newsroom/leadership", label: "Founder" },
  { to: "/newsroom/editorial-policy", label: "Editorial Policy" },
  { to: "/newsroom/press-contact", label: "Press Contact" },
];

export default function NewsroomLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentSection =
    navItems.find(
      (item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`),
    )?.to ?? "/newsroom";

  return (
    <div className="bg-[#FDF9F0] text-[#0a2225]">
      <div
        className="border-b border-[#E5DFC6] bg-[#FDF9F0]/95 backdrop-blur-sm sticky z-20 shadow-[0_1px_0_#E5DFC6]"
        style={{ top: "var(--header-height, 64px)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="md:hidden flex items-center gap-3 py-2.5">
            <NavLink
              to="/newsroom"
              end
              className={({ isActive }) =>
                `flex-shrink-0 border-r border-[#E5DFC6] pr-3 text-[9px] tracking-[0.18em] uppercase font-medium transition-colors ${
                  isActive ? "text-[#0c4d47]" : "text-[#0a2225]/55 hover:text-[#0a2225]"
                }`
              }
            >
              Newsroom
            </NavLink>
            <div className="relative min-w-0 flex-1">
              <label htmlFor="newsroom-mobile-nav" className="sr-only">
                Choose a newsroom section
              </label>
              <select
                id="newsroom-mobile-nav"
                value={currentSection}
                onChange={(e) => navigate(e.target.value)}
                className="w-full appearance-none rounded-sm border border-[#E5DFC6] bg-white/90 px-3 py-2.5 pr-9 text-[10px] tracking-[0.16em] uppercase text-[#0a2225] focus:outline-none focus:ring-2 focus:ring-[#0c4d47]/20"
              >
                <option value="/newsroom">Overview</option>
                {navItems.map((item) => (
                  <option key={item.to} value={item.to}>
                    {item.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#0a2225]/55">
                ▾
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <NavLink
              to="/newsroom"
              end
              className={({ isActive }) =>
                `flex-shrink-0 py-3.5 pr-5 mr-1 border-r border-[#E5DFC6] text-[10px] tracking-[0.28em] uppercase font-medium transition-colors ${
                  isActive ? "text-[#0c4d47]" : "text-[#0a2225]/50 hover:text-[#0a2225]"
                }`
              }
            >
              Newsroom
            </NavLink>
            <nav
              className="flex items-center gap-0 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              aria-label="Newsroom sections"
            >
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex-shrink-0 px-4 py-3.5 text-[10px] tracking-[0.2em] uppercase whitespace-nowrap transition-colors border-b-2 ${
                      isActive
                        ? "text-[#0c4d47] border-[#C7A962]"
                        : "text-[#0a2225]/55 border-transparent hover:text-[#0a2225]"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </div>
      <Outlet />
    </div>
  );
}
