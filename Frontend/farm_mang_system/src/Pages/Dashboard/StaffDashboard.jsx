// import { useEffect, useState, useCallback } from "react";
// import { Link } from "react-router-dom";
// import {
//   PawPrint,
//   Activity,
//   Users,
//   ArrowRight,
//   Calendar,
//   Layers,
//   Scale,
// } from "lucide-react";
// import api from "../../apis/axios";
// import { useAuth } from "../../context/AuthContext";
// import { useToast } from "../../context/ToastContext";

// function StatPill({ label, value, icon: Icon }) {
//   return (
//     <div
//       className="flex items-center gap-3 rounded-2xl border p-4"
//       style={{
//         backgroundColor: "var(--bg-card)",
//         borderColor: "var(--border)",
//       }}
//     >
//       <div
//         className="flex h-10 w-10 items-center justify-center rounded-xl"
//         style={{
//           backgroundColor: "color-mix(in srgb, var(--primary) 14%, transparent)",
//           color: "var(--primary)",
//         }}
//       >
//         <Icon size={18} />
//       </div>
//       <div>
//         <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
//           {label}
//         </p>
//         <p
//           className="font-display text-xl font-semibold"
//           style={{ color: "var(--text-heading)" }}
//         >
//           {value}
//         </p>
//       </div>
//     </div>
//   );
// }

// function StaffDashboard() {
//   const { user } = useAuth();
//   const showToast = useToast();

//   const isManager = user?.role === "manager";
//   const isWorker = user?.role === "worker";

//   const [loading, setLoading] = useState(true);
//   const [animals, setAnimals] = useState([]);
//   const [types, setTypes] = useState([]);
//   const [teamCount, setTeamCount] = useState(null);

//   const fetchData = useCallback(async () => {
//     try {
//       setLoading(true);
//       const [animalsRes, typesRes] = await Promise.all([
//         api.get("/animal/api/animals", { params: { limit: 100 } }),
//         api.get("/animal/api/animal-types"),
//       ]);
//       setAnimals(animalsRes.data.data || []);
//       setTypes(typesRes.data.data || []);

//       if (isManager) {
//         try {
//           const teamRes = await api.get("/animal/api/team");
//           setTeamCount((teamRes.data.data || []).length);
//         } catch {
//           setTeamCount(null);
//         }
//       }
//     } catch (err) {
//       showToast({
//         severity: "error",
//         summary: "Failed to load",
//         detail: err.response?.data?.message || "Could not load workspace",
//       });
//     } finally {
//       setLoading(false);
//     }
//   }, [showToast, isManager]);

//   useEffect(() => {
//     fetchData();
//   }, [fetchData]);

//   const bornCount = animals.filter((a) => a.acquisition_type === "BORN_IN_FARM").length;
//   const hour = new Date().getHours();
//   const greeting =
//     hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

//   if (loading) {
//     return (
//       <div className="flex min-h-[50vh] items-center justify-center">
//         <div
//           className="h-10 w-10 animate-spin rounded-full border-[3px]"
//           style={{
//             borderColor: "var(--border)",
//             borderTopColor: "var(--primary)",
//           }}
//         />
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6 pb-8 font-sans">
//       <style>{`.font-display { font-family: 'Fraunces', serif; }`}</style>

//       {/* Header */}
//       <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
//         <div>
//           <p className="text-sm" style={{ color: "var(--text-muted)" }}>
//             {greeting}
//             {user?.name ? `, ${user.name.split(" ")[0]}` : ""}
//             <span className="ml-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
//               style={{
//                 backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)",
//                 color: "var(--primary)",
//               }}
//             >
//               {user?.role}
//             </span>
//           </p>
//           <h1
//             className="font-display text-2xl font-semibold tracking-tight sm:text-3xl"
//             style={{ color: "var(--text-heading)" }}
//           >
//             My workspace
//           </h1>
//           <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
//             {isManager
//               ? "Oversee the herd and support daily farm operations."
//               : "View animal records and keep farm data up to date."}
//           </p>
//         </div>
//         <div
//           className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium"
//           style={{
//             borderColor: "var(--border)",
//             backgroundColor: "var(--bg-card)",
//             color: "var(--text-muted)",
//           }}
//         >
//           <Calendar size={14} />
//           {new Date().toLocaleDateString(undefined, {
//             weekday: "short",
//             month: "short",
//             day: "numeric",
//           })}
//         </div>
//       </div>

//       {/* Compact KPIs — operational, not owner strategy */}
//       <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
//         <StatPill label="Animals on farm" value={animals.length} icon={PawPrint} />
//         <StatPill label="Born in farm" value={bornCount} icon={Activity} />
//         <StatPill label="Animal types" value={types.length} icon={Layers} />
//         <StatPill label="Weight & Valuation" value="Module" icon={Scale} />
//         {isManager && teamCount !== null && (
//           <StatPill label="Team members" value={teamCount} icon={Users} />
//         )}
//         {isWorker && (
//           <StatPill
//             label="Your role"
//             value="Worker"
//             icon={Users}
//           />
//         )}
//       </div>

//       <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
//         {/* Quick links — role aware */}
//         <section
//           className="h-fit rounded-2xl border p-5 lg:col-span-3"
//           style={{
//             backgroundColor: "var(--bg-card)",
//             borderColor: "var(--border)",
//           }}
//         >
//           <h2
//             className="font-display mb-4 text-base font-semibold"
//             style={{ color: "var(--text-heading)" }}
//           >
//             Quick links
//           </h2>
//           <div className="flex flex-col gap-2">
//             <Link
//               to="/animals"
//               className="flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium"
//               style={{
//                 borderColor: "var(--border)",
//                 color: "var(--text)",
//                 backgroundColor: "var(--bg-muted)",
//               }}
//             >
//               Animals
//               <ArrowRight size={14} style={{ color: "var(--text-muted)" }} />
//             </Link>

//             {/* Read-only master data for staff if your routes allow GET */}
//             <Link
//               to="/master-data/animal-types"
//               className="flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium"
//               style={{
//                 borderColor: "var(--border)",
//                 color: "var(--text)",
//                 backgroundColor: "var(--bg-muted)",
//               }}
//             >
//               Animal types
//               <ArrowRight size={14} style={{ color: "var(--text-muted)" }} />
//             </Link>

//             {/* Lifecycle & weight modules */}
//             <Link
//               to="/weight"
//               className="flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium"
//               style={{
//                 borderColor: "var(--border)",
//                 color: "var(--text)",
//                 backgroundColor: "var(--bg-muted)",
//               }}
//             >
//               Weight & Valuation
//               <ArrowRight size={14} style={{ color: "var(--text-muted)" }} />
//             </Link>

//             <Link
//               to="/master-data/animal-status"
//               className="flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium"
//               style={{
//                 borderColor: "var(--border)",
//                 color: "var(--text)",
//                 backgroundColor: "var(--bg-muted)",
//               }}
//             >
//               Animal lifecycle
//               <ArrowRight size={14} style={{ color: "var(--text-muted)" }} />
//             </Link>

//             {isManager && (
//               <Link
//                 to="/team"
//                 className="flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium"
//                 style={{
//                   borderColor: "var(--border)",
//                   color: "var(--text)",
//                   backgroundColor: "var(--bg-muted)",
//                 }}
//               >
//                 Team (view)
//                 <ArrowRight size={14} style={{ color: "var(--text-muted)" }} />
//               </Link>
//             )}
//           </div>

//           <p className="mt-4 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
//             {isWorker
//               ? "You can view animals and records. Adding or editing is managed by the owner/manager."
//               : "Oversee the herd, team, and farm operations. Managing staff is owner-only."}
//           </p>
//         </section>
//       </div>
//     </div>
//   );
// }

// export default StaffDashboard;

import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  PawPrint,
  Activity,
  Users,
  ArrowRight,
  Calendar,
  Layers,
  GitBranch,
  Info,
  HeartPulse,
  Syringe,
  CalendarClock,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import api from "../../apis/axios";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

/* ── Stat pill: gradient icon badge, subtle hover lift ──────────────── */
function StatPill({ label, value, icon: Icon, accent = "var(--primary)" }) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: "var(--border)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
      }}
    >
      <div
        className="pointer-events-none absolute -right-5 -top-5 h-20 w-20 rounded-full opacity-[0.08] transition-transform duration-500 group-hover:scale-125"
        style={{ backgroundColor: accent }}
      />
      <div className="relative flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-105"
          style={{
            background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 22%, transparent), color-mix(in srgb, ${accent} 10%, transparent))`,
            color: accent,
          }}
        >
          <Icon size={18} strokeWidth={2.1} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[0.68rem] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            {label}
          </p>
          <p className="font-display text-[1.35rem] font-semibold leading-tight" style={{ color: "var(--text-heading)" }}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Progress row with gradient fill ──────────────────────── */
function ProgressRow({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span style={{ color: "var(--text)" }}>{label}</span>
        <span className="font-semibold tabular-nums" style={{ color: "var(--text-muted)" }}>
          {value}
          <span className="opacity-50"> / {total}</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: "var(--bg-muted)" }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, color-mix(in srgb, ${color} 80%, white), ${color})`,
          }}
        />
      </div>
    </div>
  );
}

/* ── Mini bar chart ──────────────────────────────────────── */
function MiniBarChart({ data, color }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex h-36 items-end gap-2">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
          <div
            className="w-full rounded-t-md transition-all duration-300 hover:brightness-110"
            style={{
              height: `${Math.max((d.value / max) * 100, d.value > 0 ? 6 : 2)}%`,
              background: `linear-gradient(180deg, color-mix(in srgb, ${color} 85%, white), ${color})`,
            }}
            title={`${d.label}: ${d.value}`}
          />
          <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Quick link row: icon + hover lift ───────────────────────────────── */
function QuickLink({ to, label, icon: Icon }) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
      style={{
        borderColor: "var(--border)",
        color: "var(--text)",
        backgroundColor: "var(--bg-muted)",
      }}
    >
      <span className="flex items-center gap-2.5">
        {Icon && <Icon size={15} style={{ color: "var(--primary)" }} />}
        {label}
      </span>
      <ArrowRight
        size={14}
        className="transition-transform duration-200 group-hover:translate-x-0.5"
        style={{ color: "var(--text-muted)" }}
      />
    </Link>
  );
}

function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className}`}
      style={{ backgroundColor: "var(--bg-muted)" }}
    />
  );
}

function StaffDashboardSkeleton() {
  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-40" />
          <SkeletonBlock className="h-8 w-52" />
        </div>
        <SkeletonBlock className="h-9 w-40" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-[4.5rem]" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <SkeletonBlock className="h-72" />
        <SkeletonBlock className="h-72" />
        <SkeletonBlock className="h-72" />
      </div>
      <SkeletonBlock className="h-40" />
    </div>
  );
}

function StaffDashboard() {
  const { user } = useAuth();
  const showToast = useToast();

  const isManager = user?.role === "manager";
  const isWorker = user?.role === "worker";

  const [loading, setLoading] = useState(true);
  const [animals, setAnimals] = useState([]);
  const [types, setTypes] = useState([]);
  const [teamCount, setTeamCount] = useState(null);
  const [pregnancies, setPregnancies] = useState([]);
  const [upcomingDeliveries, setUpcomingDeliveries] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [normalDue, setNormalDue] = useState([]);
  const [seasonalDue, setSeasonalDue] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        api.get("/animal/api/animals", { params: { limit: 100 } }),
        api.get("/animal/api/animal-types"),
        api.get("/team/api/team"),
        api.get("/breeding/api/pregnancies"),
        api.get("/breeding/api/reports/breeding/upcoming-deliveries"),
        api.get("/vaccination/api/vaccinations"),
        api.get("/vaccination/api/doses-due?days=30&category=NORMAL"),
        api.get("/vaccination/api/doses-due?days=15&category=SEASONAL"),
      ]);

      if (results[0].status === "fulfilled") setAnimals(results[0].value.data.data || []);
      if (results[1].status === "fulfilled") setTypes(results[1].value.data.data || []);
      if (results[2].status === "fulfilled" && isManager) {
        setTeamCount((results[2].value.data.data || []).length);
      }
      if (results[3].status === "fulfilled") setPregnancies(results[3].value.data.data || []);
      if (results[4].status === "fulfilled") setUpcomingDeliveries(results[4].value.data.data || []);
      if (results[5].status === "fulfilled") setVaccinations(results[5].value.data.data || []);
      if (results[6].status === "fulfilled") setNormalDue(results[6].value.data.data || []);
      if (results[7].status === "fulfilled") setSeasonalDue(results[7].value.data.data || []);
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

  const bornCount = animals.filter((a) => a.acquisition_type === "BORN_IN_FARM").length;
  const activePregnancies = pregnancies.filter((p) => !p.outcome).length;
  const dosesGiven = vaccinations.length;
  const dosesDueCount = normalDue.length + seasonalDue.length;
  const combinedDue = [...normalDue, ...seasonalDue].sort(
    (a, b) => new Date(a.due_date).valueOf() - new Date(b.due_date).valueOf()
  );

  const byType = {};
  animals.forEach((a) => {
    const key = a.animalType?.name || "Unknown";
    byType[key] = (byType[key] || 0) + 1;
  });
  const typeChart = Object.entries(byType)
    .map(([label, value]) => ({ label: label.slice(0, 8), value }))
    .slice(0, 6);

  const byGender = {};
  animals.forEach((a) => {
    const key = a.gender?.name || "Unknown";
    byGender[key] = (byGender[key] || 0) + 1;
  });
  const genderChart = Object.entries(byGender).map(([label, value]) => ({ label, value }));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  if (loading) {
    return (
      <div className="font-sans">
        <style>{`.font-display { font-family: 'Fraunces', serif; }`}</style>
        <StaffDashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 font-sans">
      <style>{`
        .font-display { font-family: 'Fraunces', serif; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in-up { animation: fadeInUp 0.4s ease-out both; }
      `}</style>

      {/* Hero header */}
      <div
        className="fade-in-up relative overflow-hidden rounded-2xl border px-6 py-6 sm:px-7 sm:py-7"
        style={{
          borderColor: "var(--border)",
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--primary) 8%, var(--bg-card)), var(--bg-card))",
        }}
      >
        <div
          className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full opacity-[0.06]"
          style={{ backgroundColor: "var(--primary)" }}
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
              {greeting}
              {user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
              <span
                className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--primary) 14%, transparent)",
                  color: "var(--primary)",
                }}
              >
                {user?.role}
              </span>
            </p>
            <h1
              className="font-display mt-1 text-2xl font-semibold tracking-tight sm:text-3xl"
              style={{ color: "var(--text-heading)" }}
            >
              My workspace
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
              {isManager
                ? "Oversee the herd and support daily farm operations."
                : "View animal records and keep farm data up to date."}
            </p>
          </div>
          <div
            className="flex items-center gap-2 self-start rounded-xl border px-3.5 py-2 text-xs font-semibold sm:self-auto"
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
      </div>

      {/* Compact KPIs */}
      <div
        className="fade-in-up grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6"
        style={{ animationDelay: "0.05s" }}
      >
        <StatPill label="Animals on farm" value={animals.length} icon={PawPrint} accent="var(--primary)" />
        <StatPill label="Born in farm" value={bornCount} icon={Activity} accent="#10b981" />
        <StatPill label="Active pregnancies" value={activePregnancies} icon={HeartPulse} accent="#e11d48" />
        <StatPill label="Doses given" value={dosesGiven} icon={Syringe} accent="#0ea5e9" />
        <StatPill
          label="Doses due"
          value={dosesDueCount}
          icon={CalendarClock}
          accent={dosesDueCount ? "#c9a227" : "#0ea5e9"}
        />
        {isManager && teamCount !== null ? (
          <StatPill label="Team members" value={teamCount} icon={Users} accent="#3b82f6" />
        ) : (
          <StatPill label="Animal types" value={types.length} icon={Layers} accent="#c9a227" />
        )}
      </div>

      {/* Watchlist */}
      <div className="fade-in-up grid grid-cols-1 gap-5 lg:grid-cols-3" style={{ animationDelay: "0.1s" }}>
        <section
          className="rounded-2xl border p-5"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}
        >
          <h2 className="font-display mb-4 flex items-center gap-2.5 text-base font-semibold" style={{ color: "var(--text-heading)" }}>
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{
                background: "linear-gradient(135deg, color-mix(in srgb, #e11d48 20%, transparent), color-mix(in srgb, #e11d48 8%, transparent))",
                color: "#e11d48",
              }}
            >
              <HeartPulse size={16} strokeWidth={2.1} />
            </span>
            Upcoming deliveries
          </h2>

          {upcomingDeliveries.length > 0 ? (
            <div className="space-y-2.5">
              {upcomingDeliveries.slice(0, 4).map((d) => {
                const days = Math.ceil(
                  (new Date(d.expected_delivery_date).valueOf() - Date.now()) / 86400000
                );
                return (
                  <div
                    key={d.pregnancy_id}
                    className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5"
                    style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-muted)" }}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold" style={{ color: "var(--text-heading)" }}>
                        {d.dam?.tag_number || "—"}
                        {d.dam?.name ? ` · ${d.dam.name}` : ""}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {new Date(d.expected_delivery_date).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold"
                      style={{
                        backgroundColor: days < 0 ? "color-mix(in srgb, #e11d48 15%, transparent)" : "color-mix(in srgb, #c9a227 15%, transparent)",
                        color: days < 0 ? "#e11d48" : "#c9a227",
                      }}
                    >
                      {days < 0 ? `${-days}d overdue` : days === 0 ? "Today" : `in ${days}d`}
                    </span>
                  </div>
                );
              })}
              <Link to="/breeding" className="flex items-center gap-1 pt-1 text-xs font-semibold" style={{ color: "#e11d48" }}>
                View breeding <ArrowRight size={12} />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <CalendarClock size={24} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Nothing due in the next 30 days.
              </p>
            </div>
          )}
        </section>
        <section
          className="rounded-2xl border p-5"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}
        >
          <h2 className="font-display mb-4 flex items-center gap-2.5 text-base font-semibold" style={{ color: "var(--text-heading)" }}>
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{
                background: "linear-gradient(135deg, color-mix(in srgb, #0ea5e9 20%, transparent), color-mix(in srgb, #0ea5e9 8%, transparent))",
                color: "#0ea5e9",
              }}
            >
              <Syringe size={16} strokeWidth={2.1} />
            </span>
            Vaccinations due
          </h2>

          {combinedDue.length > 0 ? (
            <div className="space-y-2.5">
              {combinedDue.slice(0, 4).map((d, i) => (
                <div
                  key={`${d.animal_id}-${d.vaccination_type_id}-${i}`}
                  className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5"
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-muted)" }}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold" style={{ color: "var(--text-heading)" }}>
                      {d.tag_number || "—"}
                      {d.name ? ` · ${d.name}` : ""}
                    </p>
                    <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
                      {d.vaccine || "Vaccine"}
                      {d.category === "SEASONAL" && (
                        <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide" style={{ backgroundColor: "color-mix(in srgb, #e11d48 15%, transparent)", color: "#e11d48" }}>
                          Seasonal
                        </span>
                      )}
                      {d.category === "NORMAL" && (
                        <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide" style={{ backgroundColor: "color-mix(in srgb, #0ea5e9 15%, transparent)", color: "#0ea5e9" }}>
                          Normal
                        </span>
                      )}
                    </p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold"
                    style={{
                      backgroundColor: d.days_from_now < 0 ? "color-mix(in srgb, #e11d48 15%, transparent)" : "color-mix(in srgb, #c9a227 15%, transparent)",
                      color: d.days_from_now < 0 ? "#e11d48" : "#c9a227",
                    }}
                  >
                    {d.days_from_now < 0 ? `${-d.days_from_now}d overdue` : d.days_from_now === 0 ? "Today" : `in ${d.days_from_now}d`}
                  </span>
                </div>
              ))}
              <Link to="/vaccination" className="flex items-center gap-1 pt-1 text-xs font-semibold" style={{ color: "#0ea5e9" }}>
                View vaccinations <ArrowRight size={12} />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Syringe size={24} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                All caught up — no doses due.
              </p>
            </div>
          )}
        </section>
        <section
          className="rounded-2xl border p-5"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}
        >
          <h2 className="font-display mb-2 flex items-center gap-2.5 text-base font-semibold" style={{ color: "var(--text-heading)" }}>
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{
                background: "linear-gradient(135deg, color-mix(in srgb, var(--primary) 18%, transparent), color-mix(in srgb, var(--primary) 8%, transparent))",
                color: "var(--primary)",
              }}
            >
              <TrendingUp size={16} strokeWidth={2.1} />
            </span>
            Herd at a glance
          </h2>

          {typeChart.length > 0 ? (
            <MiniBarChart data={typeChart} color="var(--primary)" />
          ) : (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <PawPrint size={24} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No animal data yet.
              </p>
            </div>
          )}

          <div className="mt-5 space-y-3 border-t pt-4" style={{ borderColor: "var(--border)" }}>
            {genderChart.length > 0 ? (
              genderChart.map((g) => (
                <ProgressRow
                  key={g.label}
                  label={g.label}
                  value={g.value}
                  total={animals.length || 1}
                  color={
                    (g.label || "").toLowerCase().includes("female")
                      ? "#f43f5e"
                      : (g.label || "").toLowerCase().includes("male")
                      ? "#0ea5e9"
                      : "var(--primary)"
                  }
                />
              ))
            ) : (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No gender data yet.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Quick actions */}
      <section
        className="fade-in-up rounded-2xl border p-5"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <h2 className="font-display mb-4 flex items-center gap-2.5 text-base font-semibold" style={{ color: "var(--text-heading)" }}>
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{
                background:
                  "linear-gradient(135deg, color-mix(in srgb, var(--primary) 18%, transparent), color-mix(in srgb, var(--primary) 8%, transparent))",
                color: "var(--primary)",
              }}
            >
              <Sparkles size={16} strokeWidth={2.1} />
            </span>
            Quick actions
          </h2>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <QuickLink to="/animals" label="Animals" icon={PawPrint} />
            <QuickLink to="/breeding" label="Breeding & reproduction" icon={HeartPulse} />
            <QuickLink to="/vaccination" label="Vaccinations" icon={Syringe} />
            <QuickLink to="/master-data/animal-status" label="Animal lifecycle" icon={GitBranch} />
            {isManager && <QuickLink to="/team" label="Team (view)" icon={Users} />}
          </div>

          <div
            className="mt-4 flex items-start gap-2 rounded-xl border px-3.5 py-3"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-muted)" }}
          >
            <Info size={14} className="mt-0.5 shrink-0" style={{ color: "var(--text-muted)" }} />
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {isWorker
                ? "You can view animals and records, and record vaccinations. Adding or editing other data is managed by the owner/manager."
                : "Oversee the herd, breeding, vaccinations, and team. Managing staff is owner-only."}
            </p>
          </div>
      </section>
    </div>
  );
}

export default StaffDashboard;