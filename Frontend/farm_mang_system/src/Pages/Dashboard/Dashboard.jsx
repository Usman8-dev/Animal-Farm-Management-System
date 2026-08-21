import { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  PawPrint,
  Users,
  Layers,
  GitBranch,
  TrendingUp,
  Activity,
  Calendar,
  ArrowRight,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import api from "../../apis/axios";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

function StatCard({ label, value, sub, icon: Icon, accent, to }) {
  const content = (
    <div
      className="group relative overflow-hidden rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: "var(--border)",
      }}
    >
      <div
        className="absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-[0.07]"
        style={{ backgroundColor: accent }}
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            {label}
          </p>
          <p
            className="mt-2 font-display text-3xl font-semibold tracking-tight"
            style={{ color: "var(--text-heading)" }}
          >
            {value}
          </p>
          {sub && (
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              {sub}
            </p>
          )}
        </div>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{
            backgroundColor: `color-mix(in srgb, ${accent} 16%, transparent)`,
            color: accent,
          }}
        >
          <Icon size={20} />
        </div>
      </div>
      {to && (
        <div
          className="mt-4 flex items-center gap-1 text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100"
          style={{ color: accent }}
        >
          View <ArrowRight size={12} />
        </div>
      )}
    </div>
  );

  return to ? (
    <Link to={to} className="block no-underline">
      {content}
    </Link>
  ) : (
    content
  );
}

function ProgressRow({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span style={{ color: "var(--text)" }}>{label}</span>
        <span className="font-medium" style={{ color: "var(--text-muted)" }}>
          {value}
          <span className="opacity-60"> / {total}</span>
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full"
        style={{ backgroundColor: "var(--bg-muted)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function MiniBarChart({ data, color }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex h-36 items-end gap-2">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
          <div
            className="w-full rounded-t-md transition-all"
            style={{
              height: `${(d.value / max) * 100}%`,
              minHeight: d.value > 0 ? 6 : 2,
              backgroundColor: color,
              opacity: 0.85,
            }}
            title={`${d.label}: ${d.value}`}
          />
          <span
            className="text-[10px] font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, action }) {
  return (
    <section
      className="rounded-2xl border p-5 shadow-sm"
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: "var(--border)",
      }}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2
          className="font-display flex items-center gap-2 text-base font-semibold"
          style={{ color: "var(--text-heading)" }}
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--primary) 12%, transparent)",
              color: "var(--primary)",
            }}
          >
            <Icon size={16} />
          </span>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function ComingSoonModule({ title, description }) {
  return (
    <div
      className="flex flex-col justify-between rounded-xl border border-dashed p-4"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-muted)" }}
    >
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Sparkles size={14} style={{ color: "var(--primary)" }} />
          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            {title}
          </p>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {description}
        </p>
      </div>
      <span
        className="mt-3 inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
        style={{
          backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)",
          color: "var(--primary)",
        }}
      >
        Coming soon
      </span>
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const showToast = useToast();
  const [loading, setLoading] = useState(true);
  const [animals, setAnimals] = useState([]);
  const [team, setTeam] = useState([]);
  const [types, setTypes] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [genders, setGenders] = useState([]);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const requests = [
        api.get("/animal/api/animals", { params: { limit: 100 } }),
        api.get("/animal/api/animal-types"),
        api.get("/animal/api/breeds"),
        api.get("/animal/api/genders"),
      ];
      // Team may 403 for workers — handle softly
      const results = await Promise.allSettled([
        ...requests,
        api.get("/team/api/team"),
      ]);

      if (results[0].status === "fulfilled") {
        setAnimals(results[0].value.data.data || []);
      }
      if (results[1].status === "fulfilled") {
        setTypes(results[1].value.data.data || []);
      }
      if (results[2].status === "fulfilled") {
        setBreeds(results[2].value.data.data || []);
      }
      if (results[3].status === "fulfilled") {
        setGenders(results[3].value.data.data || []);
      }
      if (results[4].status === "fulfilled") {
        setTeam(results[4].value.data.data || []);
      }
    } catch (err) {
      showToast({
        severity: "error",
        summary: "Dashboard",
        detail: err.response?.data?.message || "Could not load dashboard data",
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const metrics = useMemo(() => {
    const totalAnimals = animals.length;
    const bornInFarm = animals.filter(
      (a) => a.acquisition_type === "BORN_IN_FARM"
    ).length;
    const purchased = totalAnimals - bornInFarm;

    const byType = {};
    animals.forEach((a) => {
      const key = a.animalType?.name || "Unknown";
      byType[key] = (byType[key] || 0) + 1;
    });

    const byGender = {};
    animals.forEach((a) => {
      const key = a.gender?.name || "Unknown";
      byGender[key] = (byGender[key] || 0) + 1;
    });

    const typeChart = Object.entries(byType)
      .map(([label, value]) => ({ label: label.slice(0, 8), value }))
      .slice(0, 6);

    const genderChart = Object.entries(byGender).map(([label, value]) => ({
      label,
      value,
    }));

    const withParents = animals.filter((a) => a.mother_id || a.father_id).length;
    const withImages = animals.filter(
      (a) => (a.images || []).filter((i) => !i.deleted_at).length > 0
    ).length;

    const managers = team.filter((t) => t.role === "manager").length;
    const workers = team.filter((t) => t.role === "worker").length;

    // Simple “herd health score” from data completeness (Module 1)
    const completenessFactors = [
      totalAnimals > 0 ? 1 : 0,
      types.length > 0 ? 1 : 0,
      breeds.length > 0 ? 1 : 0,
      genders.length > 0 ? 1 : 0,
      totalAnimals ? withParents / totalAnimals : 0,
      totalAnimals ? withImages / totalAnimals : 0,
    ];
    const opsScore = Math.round(
      (completenessFactors.reduce((s, n) => s + n, 0) /
        completenessFactors.length) *
        100
    );

    return {
      totalAnimals,
      bornInFarm,
      purchased,
      typeChart,
      genderChart,
      withParents,
      withImages,
      managers,
      workers,
      opsScore,
      activeTypes: types.filter((t) => t.is_active !== false).length,
      activeBreeds: breeds.filter((b) => b.is_active !== false).length,
    };
  }, [animals, team, types, breeds, genders]);

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
    <div className="font-sans space-y-6 pb-8">
      <style>{`
        .font-display { font-family: 'Fraunces', serif; }
      `}</style>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {greeting}
            {user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </p>
          <h1
            className="font-display text-2xl font-semibold tracking-tight sm:text-3xl"
            style={{ color: "var(--text-heading)" }}
          >
            Farm overview
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Live snapshot of herd, team, and setup — ready for future modules.
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
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total animals"
          value={metrics.totalAnimals}
          sub={`${metrics.bornInFarm} born · ${metrics.purchased} purchased`}
          icon={PawPrint}
          accent="var(--primary)"
          to="/animals"
        />
        <StatCard
          label="Team"
          value={team.length}
          sub={`${metrics.managers} managers · ${metrics.workers} workers`}
          icon={Users}
          accent="#3b82f6"
          to="/team"
        />
        <StatCard
          label="Animal types"
          value={metrics.activeTypes}
          sub={`${metrics.activeBreeds} breeds configured`}
          icon={Layers}
          accent="#c9a227"
          to="/master-data/animal-types"
        />
        <StatCard
          label="Ops readiness"
          value={`${metrics.opsScore}%`}
          sub="Data completeness score"
          icon={Activity}
          accent="#10b981"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Herd composition */}
        <div className="lg:col-span-2 space-y-5">
          <SectionCard
            title="Herd by type"
            icon={TrendingUp}
            action={
              <Link
                to="/animals"
                className="text-xs font-semibold"
                style={{ color: "var(--primary)" }}
              >
                All animals
              </Link>
            }
          >
            {metrics.typeChart.length > 0 ? (
              <MiniBarChart data={metrics.typeChart} color="var(--primary)" />
            ) : (
              <p className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                No animals yet. Register your first animal to see charts.
              </p>
            )}
          </SectionCard>

          <SectionCard title="Herd quality signals" icon={GitBranch}>
            <div className="space-y-4">
              <ProgressRow
                label="With lineage (mother/father)"
                value={metrics.withParents}
                total={metrics.totalAnimals || 1}
                color="var(--primary)"
              />
              <ProgressRow
                label="With photos"
                value={metrics.withImages}
                total={metrics.totalAnimals || 1}
                color="#c9a227"
              />
              <ProgressRow
                label="Born on farm"
                value={metrics.bornInFarm}
                total={metrics.totalAnimals || 1}
                color="#10b981"
              />
            </div>
          </SectionCard>
        </div>

        {/* Side column */}
        <div className="space-y-5">
          <SectionCard title="Gender split" icon={PawPrint}>
            {metrics.genderChart.length > 0 ? (
              <div className="space-y-3">
                {metrics.genderChart.map((g) => (
                  <ProgressRow
                    key={g.label}
                    label={g.label}
                    value={g.value}
                    total={metrics.totalAnimals || 1}
                    color={
                      (g.label || "").toLowerCase().includes("female")
                        ? "#f43f5e"
                        : (g.label || "").toLowerCase().includes("male")
                        ? "#0ea5e9"
                        : "var(--primary)"
                    }
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No gender data yet.
              </p>
            )}
          </SectionCard>

          <SectionCard title="Quick actions" icon={Activity}>
            <div className="flex flex-col gap-2">
              {[
                { to: "/animals", label: "Manage animals" },
                { to: "/team", label: "Farm team" },
                { to: "/master-data/genders", label: "Master data" },
              ].map((a) => (
                <Link
                  key={a.to}
                  to={a.to}
                  className="flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text)",
                    backgroundColor: "var(--bg-muted)",
                  }}
                >
                  {a.label}
                  <ArrowRight size={14} style={{ color: "var(--text-muted)" }} />
                </Link>
              ))}
            </div>
          </SectionCard>

          {metrics.opsScore < 70 && (
            <div
              className="flex gap-3 rounded-2xl border p-4"
              style={{
                borderColor: "color-mix(in srgb, #c9a227 40%, var(--border))",
                backgroundColor: "color-mix(in srgb, #c9a227 8%, var(--bg-card))",
              }}
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-[#c9a227]" />
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-heading)" }}>
                  Improve readiness
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  Add lineage links and photos so breeding and records modules work better later.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Future modules — extensible strip */}
      <SectionCard title="Modules roadmap" icon={Sparkles}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ComingSoonModule
            title="Health & treatments"
            description="Vaccinations, illness logs, and treatment schedules."
          />
          <ComingSoonModule
            title="Breeding & pregnancies"
            description="Heat tracking, mating records, expected deliveries."
          />
          <ComingSoonModule
            title="Feed & inventory"
            description="Stock levels, consumption, and purchase logs."
          />
          <ComingSoonModule
            title="Finance"
            description="Costs, sales, and profit per animal or batch."
          />
        </div>
      </SectionCard>
    </div>
  );
}

export default Dashboard;