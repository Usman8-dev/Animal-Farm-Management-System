import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Sprout,
  LayoutDashboard,
  PawPrint,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";

// Each item declares which roles can see it — Owner sees everything,
// Manager sees most, Worker sees the day-to-day essentials only.
const NAV_ITEMS = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, roles: ["owner", "manager", "worker"] },
  { label: "Animals", to: "/animals", icon: PawPrint, roles: ["owner", "manager", "worker"] },
  { label: "Team", to: "/team", icon: Users, roles: ["owner", "manager"] },
  { label: "Farm Settings", to: "/farm-settings", icon: Settings, roles: ["owner"] },
];

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = user?.role;
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  const initials = user?.name
    ?.split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-30 bg-white border-b border-[#e6e2d6] font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');
        * { font-family: 'Inter', sans-serif; }
        .font-display { font-family: 'Fraunces', serif; }
      `}</style>

      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 font-display font-semibold text-[1.05rem] text-[#14261d]">
              <Sprout size={20} strokeWidth={2.2} className="text-[#1f3d2e]" />
              <span>Herdwell</span>
            </div>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-1">
              {visibleItems.map(({ label, to, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[#1f3d2e]/8 text-[#1f3d2e]"
                        : "text-[#66716a] hover:bg-[#faf8f2] hover:text-[#1b241d]"
                    }`
                  }
                >
                  <Icon size={16} strokeWidth={2} />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* User menu (desktop) */}
          <div className="hidden md:block relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-[#faf8f2] transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1f3d2e] text-xs font-semibold text-white">
                {initials || "?"}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-[#1b241d] leading-tight">
                  {user?.name || "—"}
                </p>
                <p className="text-xs text-[#66716a] capitalize leading-tight">
                  {role || "—"}
                </p>
              </div>
              <ChevronDown size={15} className="text-[#66716a]" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-[#e6e2d6] bg-white py-1.5 shadow-[0_12px_32px_-12px_rgba(20,38,29,0.18)] z-20">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3.5 py-2.5 text-sm font-medium text-[#b3452d] hover:bg-[#b3452d]/8 transition-colors"
                  >
                    <LogOut size={16} strokeWidth={2} />
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-[#1b241d]"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[#e6e2d6] py-3">
            <div className="flex flex-col gap-1">
              {visibleItems.map(({ label, to, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium ${
                      isActive
                        ? "bg-[#1f3d2e]/8 text-[#1f3d2e]"
                        : "text-[#66716a]"
                    }`
                  }
                >
                  <Icon size={17} strokeWidth={2} />
                  {label}
                </NavLink>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-[#e6e2d6] pt-3 px-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1f3d2e] text-xs font-semibold text-white">
                  {initials || "?"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1b241d] leading-tight">
                    {user?.name || "—"}
                  </p>
                  <p className="text-xs text-[#66716a] capitalize leading-tight">
                    {role || "—"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm font-medium text-[#b3452d]"
              >
                <LogOut size={16} strokeWidth={2} />
                Log out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;