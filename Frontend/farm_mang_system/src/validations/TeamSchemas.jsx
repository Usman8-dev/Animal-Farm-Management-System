import * as yup from "yup";

export const TeamMemberCreateSchema = yup.object({
  name: yup
    .string()
    .required("Name is required")
    .max(120, "Name is too long"),

  email: yup
    .string()
    .required("Email is required")
    .email("Invalid email"),

  password: yup
    .string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters"),

  gender: yup.string().required("Gender is required"),

  cnic_number: yup
    .string()
    .nullable()
    .transform((value) => value || null),

  role: yup
    .string()
    .required("Role is required")
    .oneOf(["manager", "worker"], "Role must be manager or worker"),
});

export const TeamMemberUpdateSchema = yup.object({
  name: yup
    .string()
    .required("Name is required")
    .max(120, "Name is too long"),

  gender: yup.string().required("Gender is required"),

  cnic_number: yup
    .string()
    .nullable()
    .transform((value) => value || null),

  role: yup
    .string()
    .required("Role is required")
    .oneOf(["manager", "worker"], "Role must be manager or worker"),

  password: yup
    .string()
    .nullable()
    .transform((value) => value || null)
    .test(
      "min-if-present",
      "Password must be at least 6 characters",
      (value) => !value || value.length >= 6
    ),
});