import mongoose from 'mongoose';
import { Problem } from '../models/problem.model.js';
import { Interview } from '../models/interview.model.js';
import { sendResponse } from '../utils/responseHandler.js';

export const createProblem = async (req, res, next) => {
    try {
        const { title, description, difficulty, language, starterCode, topics } = req.body;

        const newProblem = await Problem.create({
            title,
            description,
            difficulty,
            language,
            starterCode: starterCode || '',
            topics: Array.isArray(topics) ? topics : [],
            owner: req.user.id
        });

        sendResponse(res, newProblem, 'Problem created successfully', 201);
    } catch (err) {
        next(err);
    }
};

export const getMyProblems = async (req, res, next) => {
    try {
        const problems = await Problem.find({ owner: req.user.id }).sort({ createdAt: -1 });
        sendResponse(res, problems, 'Problems fetched successfully');
    } catch (err) {
        next(err);
    }
};

export const getProblemById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = new Error('Invalid Problem ID format');
            error.statusCode = 400;
            return next(error);
        }

        const problem = await Problem.findOne({ _id: id, owner: req.user.id });

        if (!problem) {
            const error = new Error('Problem not found or unauthorized');
            error.statusCode = 404;
            return next(error);
        }

        sendResponse(res, problem, 'Problem fetched successfully');
    } catch (err) {
        next(err);
    }
};

export const updateProblem = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, description, difficulty, language, starterCode, topics } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = new Error('Invalid Problem ID format');
            error.statusCode = 400;
            return next(error);
        }

        const updatePayload = {};

        if (typeof title === 'string') updatePayload.title = title;
        if (typeof description === 'string') updatePayload.description = description;
        if (typeof difficulty === 'string') updatePayload.difficulty = difficulty;
        if (typeof language === 'string') updatePayload.language = language;
        if (typeof starterCode === 'string') updatePayload.starterCode = starterCode;
        if (Array.isArray(topics)) updatePayload.topics = topics;

        if (Object.keys(updatePayload).length === 0) {
            const error = new Error('No valid fields provided for update');
            error.statusCode = 400;
            return next(error);
        }

        const updatedProblem = await Problem.findOneAndUpdate(
            { _id: id, owner: req.user.id },
            updatePayload,
            { new: true }
        );

        if (!updatedProblem) {
            const error = new Error('Problem not found or unauthorized');
            error.statusCode = 404;
            return next(error);
        }

        sendResponse(res, updatedProblem, 'Problem updated successfully');
    } catch (err) {
        next(err);
    }
};

export const deleteProblem = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = new Error('Invalid Problem ID format');
            error.statusCode = 400;
            return next(error);
        }

        const deletedProblem = await Problem.findOneAndDelete({ _id: id, owner: req.user.id });

        if (!deletedProblem) {
            const error = new Error('Problem not found or unauthorized');
            error.statusCode = 404;
            return next(error);
        }

        await Interview.updateMany(
            { 'assignedProblems.problem': deletedProblem._id },
            { $pull: { assignedProblems: { problem: deletedProblem._id } } }
        );

        return res.status(200).json({
            success: true,
            message: 'Problem deleted'
        });
    } catch (err) {
        return next(err);
    }
};
