import { CASE_STATUS_OPTIONS, labelFor } from "../../validations/HealthSchema";

// Shared display helpers for the Health & Disease module. Kept in a plain .js
// module (not a component file) so the page and every dialog agree on badges
// and labels without breaking fast-refresh rules.

export const statusSeverity = (s) =>
  ({
    OPEN: "warning",
    UNDER_TREATMENT: "info",
    RECOVERED: "success",
    CHRONIC: "secondary",
    DIED: "danger",
    CULLED: "danger",
  }[s] || "secondary");

export const severitySeverity = (s) =>
  ({ MILD: "success", MODERATE: "warning", SEVERE: "danger", CRITICAL: "danger" }[s] || "secondary");

export const caseStatusLabel = (s) => labelFor(CASE_STATUS_OPTIONS, s);
