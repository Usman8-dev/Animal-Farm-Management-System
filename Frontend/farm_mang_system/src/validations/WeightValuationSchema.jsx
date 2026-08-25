import * as yup from "yup";

export const WeightSchema = yup.object({
  weight_kg: yup
    .number()
    .typeError("Weight is required")
    .required("Weight is required")
    .positive("Weight must be greater than 0"),
  effective_from: yup.date().nullable().required("Date is required"),
  source: yup.string().nullable().max(80),
  notes: yup.string().nullable().max(500),
});

export const ValuationSchema = yup.object({
  value_amount: yup
    .number()
    .typeError("Value is required")
    .required("Value is required")
    .min(0, "Value cannot be negative"),
  basis: yup.string().nullable().max(80),
  effective_from: yup.date().nullable().required("Date is required"),
  notes: yup.string().nullable().max(500),
});