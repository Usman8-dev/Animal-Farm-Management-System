import * as yup from "yup";

export const ForgotPasswordSchema = yup.object().shape({
  email: yup
    .string()
    .trim()
    .required("Enter your email address")
    .email("Enter a valid email address"),
});