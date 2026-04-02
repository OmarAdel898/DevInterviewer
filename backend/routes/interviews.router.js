import { Router } from "express";
import { createInterview, updateInterviewCode, getMyInterviews } from '../controllers/interview.controller.js';
import { interviewValidator } from '../validators/interview.validator.js';
import {validateRequest} from '../middlewares/validateRequest.middleware.js';
import {protect} from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', protect, getMyInterviews);
router.post('/', protect, interviewValidator, validateRequest, createInterview);
router.patch('/:id', protect, updateInterviewCode); 

export default router;