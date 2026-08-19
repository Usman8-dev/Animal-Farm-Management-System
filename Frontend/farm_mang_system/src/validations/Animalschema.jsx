import * as yup from "yup";

export const AnimalSchema = yup.object().shape({
  tag_number: yup.string().trim().required("Tag number is required").max(40, "Max 40 characters"),

  name: yup.string().trim().max(80, "Max 80 characters").nullable(),

  animal_type_id: yup
    .number()
    .typeError("Select an animal type")
    .required("Select an animal type"),

  breed_id: yup
    .number()
    .typeError("Select a breed")
    .required("Select a breed"),

  gender_id: yup
    .number()
    .typeError("Select a gender")
    .required("Select a gender"),

  birth_date: yup
    .date()
    .nullable()
    .max(new Date(), "Birth date cannot be in the future"),

  acquisition_type: yup
    .string()
    .oneOf(["BORN_IN_FARM", "PURCHASED"], "Select an acquisition type")
    .required("Select an acquisition type"),

  acquired_on: yup.date().nullable(),

  mother_id: yup
    .number()
    .nullable()
    .transform((v, orig) => (orig === "" ? null : v))
    .when("acquisition_type", {
      is: "PURCHASED",
      then: (schema) => schema.nullable().test(
        "no-mother-if-purchased",
        "Purchased animals cannot have a mother selected",
        (v) => !v
      ),
    }),

  father_id: yup
    .number()
    .nullable()
    .transform((v, orig) => (orig === "" ? null : v))
    .when("acquisition_type", {
      is: "PURCHASED",
      then: (schema) => schema.nullable().test(
        "no-father-if-purchased",
        "Purchased animals cannot have a father selected",
        (v) => !v
      ),
    }),

  notes: yup.string().trim().max(2000, "Max 2000 characters").nullable(),
});