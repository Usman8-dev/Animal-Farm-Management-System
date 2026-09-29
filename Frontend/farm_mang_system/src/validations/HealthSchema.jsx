import * as yup from "yup";

const txt = (max) => yup.string().nullable().max(max);

export const DISEASE_CATEGORY_OPTIONS = [
  { label: "Bacterial", value: "BACTERIAL" },
  { label: "Viral", value: "VIRAL" },
  { label: "Parasitic", value: "PARASITIC" },
  { label: "Fungal", value: "FUNGAL" },
  { label: "Nutritional", value: "NUTRITIONAL" },
  { label: "Metabolic", value: "METABOLIC" },
  { label: "Other", value: "OTHER" },
];

export const SEVERITY_OPTIONS = [
  { label: "Mild", value: "MILD" },
  { label: "Moderate", value: "MODERATE" },
  { label: "Severe", value: "SEVERE" },
  { label: "Critical", value: "CRITICAL" },
];

export const CASE_STATUS_OPTIONS = [
  { label: "Open", value: "OPEN" },
  { label: "Under treatment", value: "UNDER_TREATMENT" },
  { label: "Recovered", value: "RECOVERED" },
  { label: "Chronic", value: "CHRONIC" },
  { label: "Died", value: "DIED" },
  { label: "Culled", value: "CULLED" },
];

export const ROUTE_OPTIONS = [
  { label: "Oral", value: "ORAL" },
  { label: "Injection (IM)", value: "INJECTION_IM" },
  { label: "Injection (IV)", value: "INJECTION_IV" },
  { label: "Subcutaneous", value: "SUBCUTANEOUS" },
  { label: "Topical", value: "TOPICAL" },
  { label: "Other", value: "OTHER" },
];

export const STATUS_FILTER_OPTIONS = [{ label: "All statuses", value: null }, ...CASE_STATUS_OPTIONS];

export const SEVERITY_FILTER_OPTIONS = [{ label: "All severities", value: null }, ...SEVERITY_OPTIONS];

export const CATEGORY_FILTER_OPTIONS = [
  { label: "All categories", value: null },
  ...DISEASE_CATEGORY_OPTIONS,
];

const CATEGORY_VALUES = DISEASE_CATEGORY_OPTIONS.map((o) => o.value);
const SEVERITY_VALUES = SEVERITY_OPTIONS.map((o) => o.value);
const STATUS_VALUES = CASE_STATUS_OPTIONS.map((o) => o.value);
const ROUTE_VALUES = ROUTE_OPTIONS.map((o) => o.value);

export const labelFor = (options, value) =>
  options.find((o) => o.value === value)?.label || value || "—";

export const DiseaseSchema = yup.object({
  code: yup.string().trim().required("Code is required").max(40, "Max 40 characters"),
  name: yup.string().trim().required("Name is required").max(120, "Max 120 characters"),
  category: yup.string().oneOf(CATEGORY_VALUES, "Select a category").default("OTHER"),
  symptoms: txt(1000),
  description: txt(1000),
  is_contagious: yup.boolean().default(false),
  is_active: yup.boolean().default(true),
});

export const MedicineSchema = yup.object({
  code: yup.string().trim().required("Code is required").max(40, "Max 40 characters"),
  name: yup.string().trim().required("Name is required").max(120, "Max 120 characters"),
  unit: txt(30),
  withdrawal_days: yup
    .number()
    .nullable()
    .typeError("Enter whole days")
    .integer("Whole days only")
    .min(0, "Cannot be negative"),
  description: txt(1000),
  is_active: yup.boolean().default(true),
});

export const HealthCaseSchema = yup
  .object({
    animal_id: yup.number().typeError("Select an animal").required("Select an animal"),
    disease_id: yup.number().nullable().typeError("Select a disease"),
    diagnosis: txt(160),
    category: yup.string().oneOf(CATEGORY_VALUES, "Select a category").default("OTHER"),
    severity: yup.string().oneOf(SEVERITY_VALUES, "Select a severity").default("MODERATE"),
    diagnosed_on: yup.date().nullable().required("Diagnosis date is required"),
    diagnosed_by: txt(120),
    is_contagious: yup.boolean().default(false),
    is_quarantined: yup.boolean().default(false),
    symptoms: txt(1000),
    notes: txt(1000),
  })
  .test(
    "diagnosis-or-disease",
    "Select a disease or type a diagnosis",
    (v) => !!v.disease_id || !!(v.diagnosis && v.diagnosis.trim())
  );

export const CaseStatusSchema = yup.object({
  status: yup.string().oneOf(STATUS_VALUES, "Select an outcome").required("Select an outcome"),
  outcome_date: yup.date().nullable(),
  outcome_notes: txt(1000),
  is_quarantined: yup.boolean().default(false),
});

export const TreatmentSchema = yup
  .object({
    medicine_id: yup.number().nullable().typeError("Select a medicine"),
    medicine_name: txt(120),
    dosage: txt(80),
    route: yup
      .string()
      .nullable()
      .oneOf([...ROUTE_VALUES, null, ""], "Select a valid route"),
    frequency: txt(80),
    start_date: yup.date().nullable().required("Start date is required"),
    end_date: yup.date().nullable(),
    administered_by: txt(120),
    withdrawal_days: yup
      .number()
      .nullable()
      .typeError("Enter whole days")
      .integer("Whole days only")
      .min(0, "Cannot be negative"),
    cost: yup.number().nullable().typeError("Enter a number").min(0, "Cost cannot be negative"),
    notes: txt(1000),
  })
  .test(
    "medicine-required",
    "Select a medicine or type its name",
    (v) => !!v.medicine_id || !!(v.medicine_name && v.medicine_name.trim())
  )
  .test(
    "dates-ordered",
    "End date cannot be before the start date",
    (v) => !v.start_date || !v.end_date || new Date(v.end_date) >= new Date(v.start_date)
  );
