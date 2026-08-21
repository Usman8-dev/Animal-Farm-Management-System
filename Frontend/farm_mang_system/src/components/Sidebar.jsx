import { useState, useMemo } from "react";
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

function Sidebar({ mobileOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isMasterDataRoute = location.pathname.startsWith("/master-data");
  const [expanded, setExpanded] = useState(isMasterDataRoute);

  // Owner → full dashboard | Manager/Worker → staff workspace
  const dashboardPath =
    user?.role === "owner" ? "/dashboard" : "/staffdashboard";

  const NAV_ITEMS = useMemo(
    () => [
      {
        label: "Dashboard",
        to: dashboardPath,
        icon: LayoutDashboard,
        roles: ["owner", "manager", "worker"],
      },
      {
        label: "Animals",
        to: "/animals",
        icon: PawPrint,
        roles: ["owner", "manager", "worker"],
      },
      {
        label: "Master Data",
        icon: Database,
        roles: ["owner", "manager"], // write UI; adjust if workers may only view
        children: [
          { label: "Animal Types", to: "/master-data/animal-types" },
          { label: "Breeds", to: "/master-data/breeds" },
          { label: "Genders", to: "/master-data/genders" },
        ],
      },
      {
        label: "Team",
        to: "/team",
        icon: Users,
        roles: ["owner", "manager"],
      },
      {
        label: "Farm Settings",
        to: "/farm-settings",
        icon: Settings,
        roles: ["owner"],
      },
    ],
    [dashboardPath]
  );

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(user?.role)
  );

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Active state: both dashboards highlight "Dashboard"
  const isDashboardActive =
    location.pathname === "/dashboard" ||
    location.pathname === "/staffdashboard";

  const content = (
    <div className="flex h-full flex-col bg-[#14261D]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
      `}</style>

      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2 font-display text-[1.05rem] font-semibold text-[#e3c55c]">
          <Sprout size={20} strokeWidth={2.2} />
          <span>Herdwell</span>
        </div>
        <button onClick={onClose} className="text-[#f4f1e6]/70 md:hidden">
          <X size={20} />
        </button>
      </div>

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

            const isDashItem = item.label === "Dashboard";

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={() => {
                  const active = isDashItem
                    ? isDashboardActive
                    : location.pathname === item.to ||
                      location.pathname.startsWith(item.to + "/");
                  return `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-[#f4f1e6]/10 text-[#e3c55c]"
                      : "text-[#f4f1e6]/70 hover:bg-[#f4f1e6]/5 hover:text-[#f4f1e6]"
                  }`;
                }}
              >
                <Icon size={17} strokeWidth={2} />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-[#f4f1e6]/10 px-3 py-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#f4f1e6]/70 transition-colors hover:bg-[#f4f1e6]/5 hover:text-[#f4f1e6]"
        >
          <LogOut size={17} strokeWidth={2} />
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 md:block">
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