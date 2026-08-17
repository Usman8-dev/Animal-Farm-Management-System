import * as yup from "yup";

export const AnimalTypeSchema = yup.object().shape({
  code: yup.string().trim().required("Code is required").max(20, "Max 20 characters"),
  name: yup.string().trim().required("Name is required").min(2, "Min 2 characters").max(60, "Max 60 characters"),
  is_active: yup.boolean(),
});

export const BreedSchema = yup.object().shape({
  animal_type_id: yup
    .number()
    .typeError("Select an animal type")
    .required("Select an animal type"),
  code: yup.string().trim().required("Code is required").max(20, "Max 20 characters"),
  name: yup.string().trim().required("Name is required").max(60, "Max 60 characters"),
  gestation_days: yup
    .number()
    .typeError("Gestation days must be a number")
    .required("Gestation days is required")
    .positive("Must be a positive number")
    .integer("Must be a whole number"),
  maturity_days: yup
    .number()
    .typeError("Maturity days must be a number")
    .required("Maturity days is required")
    .positive("Must be a positive number")
    .integer("Must be a whole number"),
  is_active: yup.boolean(),
});

export const GenderSchema = yup.object().shape({
  code: yup.string().trim().required("Code is required").max(20, "Max 20 characters"),
  name: yup.string().trim().required("Name is required").min(2, "Min 2 characters").max(30, "Max 30 characters"),
});