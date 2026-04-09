import { Router } from "express";
import {
	createInterview,
	updateInterviewCode,
	getMyInterviews,
	getInterviewById,
	deleteInterview,
	startInterview,
	endInterview,
	assignProblemsToInterview,
	removeAssignedProblem,
	getInterviewProblems
} from '../controllers/interview.controller.js';
import { assignProblemsValidator, interviewValidator } from '../validators/interview.validator.js';
import {validateRequest} from '../middlewares/validateRequest.middleware.js';
import {protect,isParticipant,isOwner} from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', protect, getMyInterviews);
router.get('/:id',protect,isParticipant,getInterviewById);
router.get('/:id/problems', protect, isParticipant, getInterviewProblems);
router.post('/', protect, interviewValidator, validateRequest, createInterview);
router.patch('/:id/start', protect, isOwner, startInterview);
router.patch('/:id/end', protect, isOwner, endInterview);
router.patch('/:id/problems', protect, isOwner, assignProblemsValidator, validateRequest, assignProblemsToInterview);
router.delete('/:id/problems/:problemId', protect, isOwner, removeAssignedProblem);
router.patch('/:id', protect,isParticipant, updateInterviewCode); 
router.delete('/:id', protect, deleteInterview);

export default router;