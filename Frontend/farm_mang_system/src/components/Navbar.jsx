import { Menu, Sun, Moon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

function Navbar({ onMenuClick }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const initials = user?.name
    ?.split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header
      className="sticky top-0 z-20 border-b transition-colors"
      style={{
        backgroundColor: "var(--navbar-bg)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="md:hidden"
            style={{ color: "var(--text)" }}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <span
            className="font-display font-semibold text-[1rem] md:hidden"
            style={{ color: "var(--text-heading)" }}
          >
            Herdwell
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors hover:opacity-80"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--bg-muted)",
              color: "var(--text)",
            }}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: "var(--primary)" }}
            >
              {initials || "?"}
            </div>
            <div className="text-right">
              <p
                className="text-sm font-semibold leading-tight"
                style={{ color: "var(--text)" }}
              >
                {user?.name || "—"}
              </p>
              <span
                className="inline-block text-[0.7rem] font-medium uppercase tracking-wide leading-tight"
                style={{ color: "var(--text-muted)" }}
              >
                {user?.role || "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;