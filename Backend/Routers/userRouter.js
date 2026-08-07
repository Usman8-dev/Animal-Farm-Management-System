import express from 'express';
const router = express.Router();
import {RegisterOwner, VerifyEmail} from '../Controller/AuthController.js'
// const { RegisterUser, LoginUser, LogoutUser } = require('../Controller/AuthController');

// const { loginValidator , RegisterValidator} = require('../Validators/authValidator');
// const { validate } = require('../Middlewares/validate');


router.post('/register',  RegisterOwner);
router.get('/verify-email', VerifyEmail)
// router.post('/login', loginValidator, validate, LoginUser);
// router.post('/logout', LogoutUser);


export default router; 