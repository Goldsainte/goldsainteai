import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { NewsroomMobilePicker } from "./ui";

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

  const mobileOptions = [{ to: "/newsroom", label: "Overview" }, ...navItems];

  return (
    <div className="bg-[#FDF9F0] text-[#0a2225]">
      <div
        className="border-b border-[#E5DFC6] bg-[#FDF9F0] sticky z-20 shadow-[0_1px_0_#E5DFC6]"
        style={{ top: "var(--header-height, 64px)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="md:hidden flex items-center gap-3 py-3">
            <NavLink
              to="/newsroom"
              end
              className={({ isActive }) =>
                `font-sans flex-shrink-0 border-r border-[#E5DFC6] pr-3 text-[9px] tracking-[0.18em] uppercase font-medium leading-none transition-colors ${
                  isActive ? "text-[#0c4d47]" : "text-[#0a2225]/55 hover:text-[#0a2225]"
                }`
              }
            >
              Newsroom
            </NavLink>
            <NewsroomMobilePicker
              label="Choose a newsroom section"
              value={currentSection}
              options={mobileOptions.map((item) => ({ label: item.label, value: item.to }))}
              onChange={(value) => navigate(value)}
              className="min-w-0 flex-1"
            />
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
      <div className="pt-4 md:pt-0">
        <Outlet />
      </div>
    </div>
  );
}
