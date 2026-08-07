import express from 'express';
const router = express.Router();
import {RegisterOwner, VerifyEmail, LoginUser} from '../Controller/AuthController.js'


router.post('/register',  RegisterOwner);
router.get('/verify-email', VerifyEmail)
router.post('/login',  LoginUser);


export default router; 