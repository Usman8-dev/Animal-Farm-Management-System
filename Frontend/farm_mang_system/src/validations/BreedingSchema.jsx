import * as yup from "yup";

const txt = (max) => yup.string().nullable().max(max);

export const PregnancyServiceSchema = yup.object({
  dam_id: yup.number().typeError("Dam is required").required("Dam is required"),
  sire_id: yup.number("Sire must be a valid animal").nullable(),
  sire_ref: txt(120),
  service_date: yup.date().nullable().required("Service date is required"),
  notes: txt(500),
});

export const ConfirmPregnancySchema = yup.object({
  confirmed_date: yup.date().nullable().required("Confirmation date is required"),
});

export const ClosePregnancySchema = yup.object({
  outcome: yup.string().oneOf(
    ["LIVE_BIRTH", "STILLBIRTH", "ABORTED", "NOT_PREGNANT"],
    "Please choose an outcome"
  ).required("Outcome is required"),
  outcome_date: yup.date().nullable().required("Outcome date is required"),
});

export const BirthSchema = yup.object({
  birth_date: yup.date().nullable().required("Birth date is required"),
  notes: txt(500),
});

export const KidSchema = yup.object({
  is_stillborn: yup.boolean().default(false),
  gender: yup.string().nullable().max(50),
  birth_weight_kg: yup.number().nullable().min(0, "Weight cannot be negative"),
  notes: txt(500),
});

export const RegisterKidSchema = yup.object({
  tag_number: yup.string().trim().required("Tag number is required").max(40),
  name: yup.string().nullable().max(80),
  gender_id: yup.number().typeError("Gender is required").required("Gender is required"),
  notes: yup.string().nullable().max(500),
});