import { body } from "express-validator";

export const interviewValidator = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Interview title is required')
        .isLength({ min: 3, max: 100 })
        .withMessage('Title must be between 3 and 100 characters'),

    body('candidateName')
        .trim()
        .notEmpty()
        .withMessage('Candidate name is required')
        .matches(/^[a-zA-Z ]+$/)
        .withMessage('Candidate name must contain only letters and spaces'),

    body('language')
        .trim()
        .notEmpty()
        .withMessage('Programming language is required')
        .isIn(['javascript', 'typescript', 'python', 'java', 'cpp', 'csharp'])
        .withMessage('Please select a supported programming language'),

    body('status')
        .optional()
        .trim()
        .isIn(['pending', 'in-progress', 'completed'])
        .withMessage('Invalid interview status')
];