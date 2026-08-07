import express from 'express';
const router = express.Router();
import {RegisterOwner, VerifyEmail, LoginUser} from '../Controller/AuthController.js'
import { RegisterValidator, loginValidator } from '../Validators/authValidator.js';
import { validate } from '../Middlewares/validate.js';


router.post('/register',RegisterValidator, validate, RegisterOwner);
router.get('/verify-email', VerifyEmail)
router.post('/login', loginValidator, validate, LoginUser);


export default router; 