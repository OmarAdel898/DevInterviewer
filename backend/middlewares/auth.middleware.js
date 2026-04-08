import jwt from 'jsonwebtoken';
import { Interview } from '../models/interview.model.js';
import { User } from '../models/user.model.js';

export const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
        const error = new Error('Not authorized');
        error.statusCode = 401;
        return next(error);
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: decoded.id };
        return next();
    } catch (error) {
        const authError = new Error('Token failed');
        authError.statusCode = 401;
        return next(authError);
    }
};

export const authorizeRoles = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            const currentUser = await User.findById(req.user?.id).select('role');

            if (!currentUser) {
                const error = new Error('User not found');
                error.statusCode = 404;
                return next(error);
            }

            if (!allowedRoles.includes(currentUser.role)) {
                const error = new Error('Forbidden');
                error.statusCode = 403;
                return next(error);
            }

            return next();
        } catch (err) {
            return next(err);
        }
    };
};

export const isParticipant = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const interview = await Interview.findById(id);

        if (!interview) {
            const error = new Error("Interview not found");
            error.statusCode = 404;
            return next(error);
        }

        const isOwner = interview.owner?.toString() === userId?.toString();
        const isCandidate = interview.candidate?.toString() === userId?.toString();

        if (isOwner || isCandidate) {
            return next();
        }

        const error = new Error("You are not a participant in this interview");
        error.statusCode = 403;
        return next(error);

    } catch (err) {
        next(err); 
    }
};