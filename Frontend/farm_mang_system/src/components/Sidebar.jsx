import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Sprout,
  LayoutDashboard,
  PawPrint,
  Users,
  Settings,
  Database,
  LogOut,
  X,
  ChevronDown,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, roles: ["owner", "manager", "worker"] },
  { label: "Animals", to: "/animals", icon: PawPrint, roles: ["owner", "manager", "worker"] },
  {
    label: "Master Data",
    icon: Database,
    roles: ["owner", "manager"],
    children: [
      { label: "Animal Types", to: "/master-data/animal-types" },
      { label: "Breeds", to: "/master-data/breeds" },
      { label: "Genders", to: "/master-data/genders" },
    ],
  },
  { label: "Team", to: "/team", icon: Users, roles: ["owner", "manager"] },
  { label: "Farm Settings", to: "/farm-settings", icon: Settings, roles: ["owner"] },
];

function Sidebar({ mobileOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isMasterDataRoute = location.pathname.startsWith("/master-data");
  const [expanded, setExpanded] = useState(isMasterDataRoute);

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const content = (
    <div className="flex h-full flex-col bg-[#14261D]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
      `}</style>

      {/* Brand */}
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2 font-display font-semibold text-[1.05rem] text-[#e3c55c]">
          <Sprout size={20} strokeWidth={2.2} />
          <span>Herdwell</span>
        </div>
        <button onClick={onClose} className="md:hidden text-[#f4f1e6]/70">
          <X size={20} />
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-2">
        <div className="flex flex-col gap-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;

            if (item.children) {
              return (
                <div key={item.label}>
                  <button
                    onClick={() => setExpanded((v) => !v)}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isMasterDataRoute
                        ? "text-[#e3c55c]"
                        : "text-[#f4f1e6]/70 hover:bg-[#f4f1e6]/5 hover:text-[#f4f1e6]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon size={17} strokeWidth={2} />
                      {item.label}
                    </span>
                    <ChevronDown
                      size={15}
                      className={`transition-transform ${expanded ? "rotate-180" : ""}`}
                    />
                  </button>

                  {expanded && (
                    <div className="mt-1 flex flex-col gap-0.5 pl-[2.15rem]">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          onClick={onClose}
                          className={({ isActive }) =>
                            `rounded-lg px-3 py-2 text-[0.83rem] font-medium transition-colors ${
                              isActive
                                ? "bg-[#f4f1e6]/10 text-[#e3c55c]"
                                : "text-[#f4f1e6]/60 hover:bg-[#f4f1e6]/5 hover:text-[#f4f1e6]"
                            }`
                          }
                        >
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#f4f1e6]/10 text-[#e3c55c]"
                      : "text-[#f4f1e6]/70 hover:bg-[#f4f1e6]/5 hover:text-[#f4f1e6]"
                  }`
                }
              >
                <Icon size={17} strokeWidth={2} />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-[#f4f1e6]/10">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#f4f1e6]/70 hover:bg-[#f4f1e6]/5 hover:text-[#f4f1e6] transition-colors"
        >
          <LogOut size={17} strokeWidth={2} />
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:block w-60 shrink-0 h-screen sticky top-0">
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <div className="absolute left-0 top-0 h-full w-64">{content}</div>
        </div>
      )}
    </>
  );
}

export default Sidebar;