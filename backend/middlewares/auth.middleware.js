import jwt from 'jsonwebtoken';
import { Interview } from '../models/interview.model.js';
export const protect = async (req, res, next) => {
    let token = req.headers.authorization?.split(' ')[1];

    if (!token) return res.status(401).json({ message: "Not authorized" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: decoded.id }; 
        next();
    } catch (error) {
        res.status(401).json({ message: "Token failed" });
    }
};

export const isParticipant = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user?._id || req.user?.id;

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