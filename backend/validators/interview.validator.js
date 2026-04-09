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

    body('focus')
        .trim()
        .notEmpty()
        .withMessage('Focus area is required (e.g., System Design)')
        .isLength({ min: 3, max: 200 })
        .withMessage('Focus description must be between 3 and 200 characters'),

    body('time')
        .notEmpty()
        .withMessage('Interview time is required')
        .isISO8601()
        .withMessage('Please provide a valid date and time format (ISO8601)')
        .toDate()
        .custom((value) => {
            if (new Date(value) < new Date()) {
                throw new Error('Interview time cannot be in the past');
            }
            return true;
        }),
    body('status')
        .optional()
        .trim()
        .isIn(['pending', 'in-progress', 'completed'])
        .withMessage('Invalid interview status')
];

export const assignProblemsValidator = [
    body('problemIds')
        .isArray({ min: 1 })
        .withMessage('At least one problem ID is required'),

    body('problemIds.*')
        .isMongoId()
        .withMessage('Each problem ID must be a valid Mongo ID')
];