import * as yup from "yup";

const txt = (max) => yup.string().nullable().max(max);

export const VaccinationTypeSchema = yup.object({
  code: yup.string().trim().required("Code is required").max(40, "Max 40 characters"),
  name: yup.string().trim().required("Name is required").max(120, "Max 120 characters"),
  description: txt(500),
  is_active: yup.boolean().default(true),
});

export const VaccinationSchema = yup.object({
  animal_id: yup.number().typeError("Select an animal").required("Select an animal"),
  vaccination_type_id: yup.number().typeError("Select a vaccine").required("Select a vaccine"),
  category: yup.string().oneOf(["NORMAL", "SEASONAL"], "Invalid category").default("NORMAL"),
  administered_date: yup.date().nullable().required("Administered date is required"),
  next_due_date: yup.date().nullable(),
  dose_number: yup.number().nullable().min(1, "Min 1"),
  batch_number: txt(80),
  administered_by: txt(120),
  cost: yup.number().nullable().min(0, "Cost cannot be negative"),
  notes: txt(500),
});