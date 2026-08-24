import * as yup from "yup";

export const AnimalStatusSchema = yup.object().shape({
  code: yup.string().trim().required("Code is required").max(20, "Max 20 characters"),
  name: yup.string().trim().required("Name is required").min(2, "Min 2 characters").max(40, "Max 40 characters"),
  category: yup
    .string()
    .required("Select a category")
    .oneOf(["PRESENCE", "REPRODUCTIVE", "HEALTH"], "Select a valid category"),
  is_active: yup.boolean(),
});

export const StatusChangeSchema = yup.object().shape({
  status_id: yup.number().typeError("Select a status").required("Select a status"),
  effective_from: yup.date().nullable(),
  reason: yup.string().trim().max(500, "Max 500 characters").nullable(),
});