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
  Scale,
  GitBranch,
  Info,
} from "lucide-react";
import api from "../../apis/axios";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

/* ── Stat pill: gradient icon badge, subtle hover lift ──────────────── */
function StatPill({ label, value, icon: Icon }) {
  return (
    <div
      className="group flex items-center gap-3 rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: "var(--border)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
      }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--primary) 22%, transparent), color-mix(in srgb, var(--primary) 10%, transparent))",
          color: "var(--primary)",
        }}
      >
        <Icon size={18} strokeWidth={2.1} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          {label}
        </p>
        <p className="font-display text-xl font-semibold leading-tight" style={{ color: "var(--text-heading)" }}>
          {value}
        </p>
      </div>
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-[4.5rem]" />
        ))}
      </div>
      <SkeletonBlock className="h-64" />
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

  const bornCount = animals.filter((a) => a.acquisition_type === "BORN_IN_FARM").length;
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
        className="fade-in-up grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
        style={{ animationDelay: "0.05s" }}
      >
        <StatPill label="Animals on farm" value={animals.length} icon={PawPrint} />
        <StatPill label="Born in farm" value={bornCount} icon={Activity} />
        <StatPill label="Animal types" value={types.length} icon={Layers} />
        <StatPill label="Weight & Valuation" value="Module" icon={Scale} />
        {isManager && teamCount !== null && (
          <StatPill label="Team members" value={teamCount} icon={Users} />
        )}
        {isWorker && <StatPill label="Your role" value="Worker" icon={Users} />}
      </div>

      {/* Quick links */}
      <div className="fade-in-up grid grid-cols-1 gap-5 lg:grid-cols-3" style={{ animationDelay: "0.1s" }}>
        <section
          className="h-fit rounded-2xl border p-5 lg:col-span-3"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <h2
            className="font-display mb-4 flex items-center gap-2.5 text-base font-semibold"
            style={{ color: "var(--text-heading)" }}
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{
                background:
                  "linear-gradient(135deg, color-mix(in srgb, var(--primary) 18%, transparent), color-mix(in srgb, var(--primary) 8%, transparent))",
                color: "var(--primary)",
              }}
            >
              <ArrowRight size={16} strokeWidth={2.1} />
            </span>
            Quick links
          </h2>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <QuickLink to="/animals" label="Animals" icon={PawPrint} />
            <QuickLink to="/master-data/animal-types" label="Animal types" icon={Layers} />
            <QuickLink to="/weight" label="Weight & Valuation" icon={Scale} />
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
                ? "You can view animals and records. Adding or editing is managed by the owner/manager."
                : "Oversee the herd, team, and farm operations. Managing staff is owner-only."}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default StaffDashboard;