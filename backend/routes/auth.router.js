import { Router } from "express";
import { register, login, refreshAccessToken } from '../controllers/auth.controller.js';
import {registerValidator,loginValidator} from '../validators/auth.validator.js';
import {validateRequest} from '../middlewares/validateRequest.middleware.js';
const router=Router();

router.post('/register',registerValidator,validateRequest,register);
router.post('/login',loginValidator,validateRequest,login);
router.get('/refresh-token',refreshAccessToken);

export default router;
