import * as yup from "yup";

export const ResetPasswordSchema = yup.object().shape({
  password: yup
    .string()
    .required("Enter your password")
    .min(6, "Password must be at least 6 characters"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords do not match")
    .required("Confirm your password"),
});