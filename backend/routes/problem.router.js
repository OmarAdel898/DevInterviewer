import { Router } from 'express';
import {
    createProblem,
    deleteProblem,
    getMyProblems,
    getProblemById,
    updateProblem
} from '../controllers/problem.controller.js';
import { createProblemValidator, updateProblemValidator } from '../validators/problem.validator.js';
import { validateRequest } from '../middlewares/validateRequest.middleware.js';
import { authorizeRoles, protect } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', protect, authorizeRoles('admin', 'interviewer'), getMyProblems);
router.get('/:id', protect, authorizeRoles('admin', 'interviewer'), getProblemById);
router.post('/', protect, authorizeRoles('admin', 'interviewer'), createProblemValidator, validateRequest, createProblem);
router.patch('/:id', protect, authorizeRoles('admin', 'interviewer'), updateProblemValidator, validateRequest, updateProblem);
router.delete('/:id', protect, authorizeRoles('admin', 'interviewer'), deleteProblem);

export default router;
