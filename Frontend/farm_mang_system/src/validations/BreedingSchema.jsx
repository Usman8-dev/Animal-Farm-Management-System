import * as yup from "yup";

const txt = (max) => yup.string().nullable().max(max);

export const PregnancyServiceSchema = yup.object({
  dam_id: yup.number().typeError("Female animal is required").required("Female animal is required"),
  sire_id: yup.number("Male animal must be a valid animal").nullable(),
  sire_ref: txt(120),
  service_date: yup.date().nullable().required("Service date is required"),
  notes: txt(500),
});

export const ConfirmPregnancySchema = yup.object({
  confirmed_date: yup.date().nullable().required("Expected delivery date is required"),
});

export const ClosePregnancySchema = yup.object({
  outcome: yup.string().oneOf(
    ["LIVE_BIRTH", "STILLBIRTH", "ABORTED", "NOT_PREGNANT"],
    "Please choose an outcome"
  ).required("Outcome is required"),
  outcome_date: yup.date().nullable().required("Outcome date is required"),
});

// One child row inside the Record Birth dialog. Live children are registered as
// farm animals (so they need a tag, animal type, breed and gender); stillborn
// children only carry an optional free-text sex, weight and notes.
const birthKidRow = yup.object({
  id: yup.number().nullable(),
  stillborn: yup.boolean().default(false),
  tag_number: yup.string().trim().max(40, "Max 40 characters").when("stillborn", {
    is: true,
    then: (s) => s.notRequired(),
    otherwise: (s) => s.required("Tag number is required"),
  }),
  name: txt(80),
  animal_type_id: yup.number().nullable().when("stillborn", {
    is: true,
    then: (s) => s.notRequired(),
    otherwise: (s) => s.typeError("Select an animal type").required("Select an animal type"),
  }),
  breed_id: yup.number().nullable().when("stillborn", {
    is: true,
    then: (s) => s.notRequired(),
    otherwise: (s) => s.typeError("Select a breed").required("Select a breed"),
  }),
  gender_id: yup.number().nullable().when("stillborn", {
    is: true,
    then: (s) => s.notRequired(),
    otherwise: (s) => s.typeError("Select a gender").required("Select a gender"),
  }),
  gender: txt(50),
  birth_weight_kg: yup.number().nullable().min(0, "Weight cannot be negative"),
  notes: txt(500),
});

export const BirthSchema = yup.object({
  birth_date: yup.date().nullable().required("Birth date is required"),
  notes: txt(500),
  // A birth can produce several children — one entry per child, saved together.
  kids: yup.array().of(birthKidRow).min(1, "Add at least one child"),
});