import { Router } from "express";
import { createInterview, updateInterviewCode, getMyInterviews ,getInterviewById, deleteInterview } from '../controllers/interview.controller.js';
import { interviewValidator } from '../validators/interview.validator.js';
import {validateRequest} from '../middlewares/validateRequest.middleware.js';
import {protect,isParticipant} from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', protect, getMyInterviews);
router.get('/:id',protect,isParticipant,getInterviewById);
router.post('/', protect, interviewValidator, validateRequest, createInterview);
router.patch('/:id', protect,isParticipant, updateInterviewCode); 
router.delete('/:id', protect, deleteInterview);

export default router;