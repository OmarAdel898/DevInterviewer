import { Router } from "express";
import { register, login, refreshAccessToken,getUserByEmail, updateProfile } from '../controllers/auth.controller.js';
import {registerValidator,loginValidator,emailValidator, profileValidator} from '../validators/auth.validator.js';
import {validateRequest} from '../middlewares/validateRequest.middleware.js';
import { authorizeRoles, protect } from '../middlewares/auth.middleware.js';
const router=Router();

router.post('/register',registerValidator,validateRequest,register);
router.post('/login',loginValidator,validateRequest,login);
router.get('/refresh-token',refreshAccessToken);
router.post('/user',protect,authorizeRoles('admin', 'interviewer'),emailValidator,validateRequest,getUserByEmail);
router.patch('/profile', protect, profileValidator, validateRequest, updateProfile);
export default router;
