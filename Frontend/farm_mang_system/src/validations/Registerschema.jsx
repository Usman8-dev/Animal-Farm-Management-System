import * as yup from "yup";

export const RegisterSchema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .required("Enter your full name")
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name is too long"),

  cnic_number: yup
    .string()
    .trim()
    .required("CNIC number is required")
    .matches(/^\d{5}-\d{7}-\d{1}$/, "Use the format 12345-1234567-1"),

  gender: yup
  .string()
  .required("Select a gender")
  .oneOf(["Male", "Female", "Other"], "Select a valid gender"),

  email: yup
    .string()
    .trim()
    .required("Enter your email address")
    .email("Enter a valid email address"),

  password: yup
    .string()
    .required("Create a password")
    .min(6, "Password must be at least 6 characters")
    .matches(/[A-Z]/, "Include at least one uppercase letter")
    .matches(/[a-z]/, "Include at least one lowercase letter")
    .matches(/[0-9]/, "Include at least one number"),

  confirmPassword: yup
    .string()
    .required("Confirm your password")
    .oneOf([yup.ref("password")], "Passwords do not match"),
});