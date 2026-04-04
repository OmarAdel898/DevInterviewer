import { Router } from "express";
import { register, login, refreshAccessToken,getUserByEmail } from '../controllers/auth.controller.js';
import {registerValidator,loginValidator,emailValidator} from '../validators/auth.validator.js';
import {validateRequest} from '../middlewares/validateRequest.middleware.js';
const router=Router();

router.post('/register',registerValidator,validateRequest,register);
router.post('/login',loginValidator,validateRequest,login);
router.get('/refresh-token',refreshAccessToken);
router.post('/user',emailValidator,validateRequest,getUserByEmail);
export default router;
