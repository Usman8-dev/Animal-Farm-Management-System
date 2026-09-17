import express from 'express';
const router = express.Router();
import {RegisterOwner, VerifyEmail, ForgotPassword, ResetPassword, LoginUser, LogoutUser, GetMe} from '../Controller/AuthController.js'
import { RegisterValidator, loginValidator, forgotPasswordValidator, resetPasswordValidator } from '../Validators/authValidator.js';
import { validate } from '../Middlewares/validate.js';
import { IsLoginUser } from '../Middlewares/IsLoginUser.js';


router.post('/register',RegisterValidator, validate, RegisterOwner);
router.get('/verify-email', VerifyEmail)
router.post('/login', loginValidator, validate, LoginUser);
router.post('/forgot-password', forgotPasswordValidator, validate, ForgotPassword);
router.post('/reset-password', resetPasswordValidator, validate, ResetPassword);
router.post('/logout',  LogoutUser);
router.get('/me', IsLoginUser, GetMe);
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'I am Health Alhamdulillah' });
});



export default router; 