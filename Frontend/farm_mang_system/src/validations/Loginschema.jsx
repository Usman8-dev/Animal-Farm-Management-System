import * as yup from "yup";

export const LoginSchema = yup.object().shape({
  email: yup
    .string()
    .trim()
    .required("Enter your email address")
    .email("Enter a valid email address"),

  password: yup
    .string()
    .required("Enter your password"),
});