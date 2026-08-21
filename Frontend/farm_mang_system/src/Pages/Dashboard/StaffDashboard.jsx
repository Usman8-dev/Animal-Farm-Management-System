import { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  PawPrint,
  Search,
  Eye,
  Activity,
  Users,
  ArrowRight,
  Calendar,
  Layers,
} from "lucide-react";
import { InputText } from "primereact/inputtext";
import api from "../../apis/axios";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

function StatPill({ label, value, icon: Icon }) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl border p-4"
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: "var(--border)",
      }}
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{
          backgroundColor: "color-mix(in srgb, var(--primary) 14%, transparent)",
          color: "var(--primary)",
        }}
      >
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          {label}
        </p>
        <p
          className="font-display text-xl font-semibold"
          style={{ color: "var(--text-heading)" }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function StaffDashboard() {
  const { user } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();

  const isManager = user?.role === "manager";
  const isWorker = user?.role === "worker";

  const [loading, setLoading] = useState(true);
  const [animals, setAnimals] = useState([]);
  const [types, setTypes] = useState([]);
  const [teamCount, setTeamCount] = useState(null);
  const [query, setQuery] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [animalsRes, typesRes] = await Promise.all([
        api.get("/animal/api/animals", { params: { limit: 100 } }),
        api.get("/animal/api/animal-types"),
      ]);
      setAnimals(animalsRes.data.data || []);
      setTypes(typesRes.data.data || []);

      if (isManager) {
        try {
          const teamRes = await api.get("/animal/api/team");
          setTeamCount((teamRes.data.data || []).length);
        } catch {
          setTeamCount(null);
        }
      }
    } catch (err) {
      showToast({
        severity: "error",
        summary: "Failed to load",
        detail: err.response?.data?.message || "Could not load workspace",
      });
    } finally {
      setLoading(false);
    }
  }, [showToast, isManager]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return animals.slice(0, 8);
    return animals
      .filter(
        (a) =>
          a.tag_number?.toLowerCase().includes(q) ||
          a.name?.toLowerCase().includes(q) ||
          a.animalType?.name?.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [animals, query]);

  const bornCount = animals.filter((a) => a.acquisition_type === "BORN_IN_FARM").length;
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div
          className="h-10 w-10 animate-spin rounded-full border-[3px]"
          style={{
            borderColor: "var(--border)",
            borderTopColor: "var(--primary)",
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 font-sans">
      <style>{`.font-display { font-family: 'Fraunces', serif; }`}</style>

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {greeting}
            {user?.name ? `, ${user.name.split(" ")[0]}` : ""}
            <span className="ml-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{
                backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)",
                color: "var(--primary)",
              }}
            >
              {user?.role}
            </span>
          </p>
          <h1
            className="font-display text-2xl font-semibold tracking-tight sm:text-3xl"
            style={{ color: "var(--text-heading)" }}
          >
            My workspace
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {isManager
              ? "Oversee the herd and support daily farm operations."
              : "Find animals and keep records up to date."}
          </p>
        </div>
        <div
          className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--bg-card)",
            color: "var(--text-muted)",
          }}
        >
          <Calendar size={14} />
          {new Date().toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </div>
      </div>

      {/* Compact KPIs — operational, not owner strategy */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatPill label="Animals on farm" value={animals.length} icon={PawPrint} />
        <StatPill label="Born in farm" value={bornCount} icon={Activity} />
        <StatPill label="Animal types" value={types.length} icon={Layers} />
        {isManager && teamCount !== null && (
          <StatPill label="Team members" value={teamCount} icon={Users} />
        )}
        {isWorker && (
          <StatPill
            label="Your role"
            value="Worker"
            icon={Users}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Find animal — primary task */}
        <section
          className="rounded-2xl border p-5 lg:col-span-2"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border)",
          }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2
              className="font-display text-base font-semibold"
              style={{ color: "var(--text-heading)" }}
            >
              Find an animal
            </h2>
            <Link
              to="/animals"
              className="text-xs font-semibold"
              style={{ color: "var(--primary)" }}
            >
              Full list
            </Link>
          </div>

          <div className="relative mb-4">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-muted)" }}
            />
            <InputText
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tag, name, or type…"
              className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm"
              style={{
                backgroundColor: "var(--bg-muted)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            />
          </div>

          <div className="flex flex-col gap-2">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                No animals match your search.
              </p>
            ) : (
              filtered.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => navigate(`/animals/${a.id}`)}
                  className="flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-colors"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--bg-muted)",
                  }}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold" style={{ color: "var(--text)" }}>
                      {a.name || a.tag_number}
                      <span className="ml-2 font-normal" style={{ color: "var(--text-muted)" }}>
                        #{a.tag_number}
                      </span>
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {[a.animalType?.name, a.breed?.name, a.gender?.name]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <Eye size={16} style={{ color: "var(--primary)" }} />
                </button>
              ))
            )}
          </div>
        </section>

        {/* Quick links — role aware */}
        <section
          className="h-fit rounded-2xl border p-5"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border)",
          }}
        >
          <h2
            className="font-display mb-4 text-base font-semibold"
            style={{ color: "var(--text-heading)" }}
          >
            Quick links
          </h2>
          <div className="flex flex-col gap-2">
            <Link
              to="/animals"
              className="flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium"
              style={{
                borderColor: "var(--border)",
                color: "var(--text)",
                backgroundColor: "var(--bg-muted)",
              }}
            >
              Animals
              <ArrowRight size={14} style={{ color: "var(--text-muted)" }} />
            </Link>

            {/* Read-only master data for staff if your routes allow GET */}
            <Link
              to="/master-data/animal-types"
              className="flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium"
              style={{
                borderColor: "var(--border)",
                color: "var(--text)",
                backgroundColor: "var(--bg-muted)",
              }}
            >
              Animal types
              <ArrowRight size={14} style={{ color: "var(--text-muted)" }} />
            </Link>

            {isManager && (
              <Link
                to="/team"
                className="flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--text)",
                  backgroundColor: "var(--bg-muted)",
                }}
              >
                Team (view)
                <ArrowRight size={14} style={{ color: "var(--text-muted)" }} />
              </Link>
            )}
          </div>

          <p className="mt-4 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {isWorker
              ? "You can view animals and records. Adding or editing is managed by the owner/manager."
              : "You can view the herd and team. Creating staff is owner-only."}
          </p>
        </section>
      </div>
    </div>
  );
}

export default StaffDashboard;