import express from 'express';
const router = express.Router();
import {RegisterOwner} from '../Controller/AuthController.js'
// const { RegisterUser, LoginUser, LogoutUser } = require('../Controller/AuthController');

// const { loginValidator , RegisterValidator} = require('../Validators/authValidator');
// const { validate } = require('../Middlewares/validate');


router.post('/register',  RegisterOwner);
// router.post('/login', loginValidator, validate, LoginUser);
// router.post('/logout', LogoutUser);


export default router; 