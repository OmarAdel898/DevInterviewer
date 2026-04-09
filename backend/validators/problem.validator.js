import { body } from 'express-validator';

const languageValues = ['javascript', 'typescript', 'python', 'java', 'cpp', 'csharp'];

export const createProblemValidator = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Problem title is required')
        .isLength({ min: 3, max: 120 })
        .withMessage('Problem title must be between 3 and 120 characters'),

    body('description')
        .trim()
        .notEmpty()
        .withMessage('Problem description is required')
        .isLength({ min: 10 })
        .withMessage('Problem description must be at least 10 characters'),

    body('difficulty')
        .optional()
        .trim()
        .isIn(['easy', 'medium', 'hard'])
        .withMessage('Difficulty must be easy, medium, or hard'),

    body('language')
        .trim()
        .notEmpty()
        .withMessage('Problem language is required')
        .isIn(languageValues)
        .withMessage('Please select a supported programming language'),

    body('starterCode')
        .optional()
        .isString()
        .withMessage('Starter code must be a valid string'),

    body('topics')
        .optional()
        .isArray()
        .withMessage('Topics must be an array of strings'),

    body('topics.*')
        .optional()
        .isString()
        .withMessage('Each topic must be a valid string')
];

export const updateProblemValidator = [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 3, max: 120 })
        .withMessage('Problem title must be between 3 and 120 characters'),

    body('description')
        .optional()
        .trim()
        .isLength({ min: 10 })
        .withMessage('Problem description must be at least 10 characters'),

    body('difficulty')
        .optional()
        .trim()
        .isIn(['easy', 'medium', 'hard'])
        .withMessage('Difficulty must be easy, medium, or hard'),

    body('language')
        .optional()
        .trim()
        .isIn(languageValues)
        .withMessage('Please select a supported programming language'),

    body('starterCode')
        .optional()
        .isString()
        .withMessage('Starter code must be a valid string'),

    body('topics')
        .optional()
        .isArray()
        .withMessage('Topics must be an array of strings'),

    body('topics.*')
        .optional()
        .isString()
        .withMessage('Each topic must be a valid string')
];
