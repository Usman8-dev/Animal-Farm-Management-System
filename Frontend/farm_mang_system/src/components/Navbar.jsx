import { Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Navbar({ onMenuClick }) {
  const { user } = useAuth();

  const initials = user?.name
    ?.split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-[#e6e2d6]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');
        * { font-family: 'Inter', sans-serif; }
        .font-display { font-family: 'Fraunces', serif; }
      `}</style>

      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        {/* Mobile menu toggle + software name */}
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="md:hidden text-[#1b241d]" aria-label="Open menu">
            <Menu size={22} />
          </button>
          <span className="font-display font-semibold text-[1rem] text-[#14261d] md:hidden">
            Herdwell
          </span>
        </div>

        {/* Logged-in user: name + role tag */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1f3d2e] text-xs font-semibold text-white">
            {initials || "?"}
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-[#1b241d] leading-tight">
              {user?.name || "—"}
            </p>
            <span className="inline-block text-[0.7rem] font-medium uppercase tracking-wide text-[#66716a] leading-tight">
              {user?.role || "—"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;