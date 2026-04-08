import { body } from "express-validator";
import { User } from "../models/user.model.js";

export const registerValidator = [
    body('fullName')
        .trim()
        .notEmpty()
        .withMessage('Full name is required')
        .matches(/^[a-zA-Z ]+$/)
        .withMessage('Full name must contain only letters and spaces'),
        
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Invalid email address')
        .normalizeEmail()
        .custom(async (value) => {
            const user = await User.findOne({ email: value });
            if (user) {
                throw new Error('E-mail already in use');
            }
        }),
        
    body('password')
        .trim()
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),

    body('role')
        .optional()
        .trim()
        .isIn(['interviewer', 'user'])
        .withMessage('Role must be either interviewer or user')
];

export const loginValidator=[
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Invalid email address'),
        
    body('password')
        .trim()
        .notEmpty()
        .withMessage('Password is required')
]

export const emailValidator=[
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Invalid email address'),
]