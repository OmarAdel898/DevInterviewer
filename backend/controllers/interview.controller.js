import {Interview} from '../models/interview.model.js';
import mongoose from 'mongoose';
import {sendResponse} from '../utils/responseHandler.js';
import { User } from '../models/user.model.js';
import { Problem } from '../models/problem.model.js';

export const createInterview=async(req,res,next)=>{
    try {
    const { title, candidateName, language, focus, time, candidate} = req.body;
    const newInterview= await Interview.create({
        title,
        candidateName,
        language,
        focus,
        time,
        candidate,
        owner: req.user.id
    });
    sendResponse(res, newInterview, "Interview created successfully", 201);
    }catch(err){
        next(err);
    }
    
}
export const updateInterviewCode=async(req,res,next)=>{
    try{
        const { id } = req.params;
        const { code } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = new Error('Invalid Interview ID format');
            error.statusCode = 400;
            return next(error);
        }

        const updatePayload = {};

        if (typeof code === 'string') {
            updatePayload.code = code;
        }

        if (Object.keys(updatePayload).length === 0) {
            const error = new Error('No valid fields provided for update');
            error.statusCode = 400;
            return next(error);
        }

        const updated=await Interview.findByIdAndUpdate(id, updatePayload, {new:true});
        if (!updated) {
            const error = new Error("Interview not found or unauthorized");
            error.statusCode = 404;
            return next(error);
        }

        sendResponse(res,updated,"Interview code updated successfully");
    }
    catch(err){
        next(err);
    }

}

export const getMyInterviews=async(req,res,next)=>{
    try{
        const currentUser = await User.findById(req.user.id).select('role');

        if (!currentUser) {
            const error = new Error('User not found');
            error.statusCode = 404;
            return next(error);
        }

        const isCandidateView = currentUser.role === 'user';
        const filter = isCandidateView ? { candidate: req.user.id } : { owner: req.user.id };

        const interviews = await Interview.find(filter)
            .populate('owner', 'fullName email')
            .populate('candidate', 'fullName email')
            .populate('assignedProblems.problem', 'title difficulty language')
            .sort({ time: 1, createdAt: -1 });

        sendResponse(res, interviews, "Interviews fetched successfully");
    }
    catch(err){
        next(err);
    }
}

export const getInterviewById=async(req,res,next)=>{
    
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = new Error("Invalid Interview ID format");
            error.statusCode = 400;
            return next(error);
        }

        const interview = await Interview.findOne({ _id: id, $or: [{ owner: req.user.id }, { candidate: req.user.id }] })
            .populate('assignedProblems.problem', 'title description difficulty language starterCode topics');

        if (!interview) {
            const error = new Error("Interview not found or unauthorized");
            error.statusCode = 404;
            return next(error);
        }

        sendResponse(res, interview, "Interview fetched successfully");
    } catch (err) {
        console.log("FULL ERROR LOG:", err); // Look at your TERMINAL/CMD, not the browser
        next(err);
    }
}

export const startInterview = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = new Error('Invalid Interview ID format');
            error.statusCode = 400;
            return next(error);
        }

        const interview = await Interview.findOne({ _id: id, owner: req.user.id });

        if (!interview) {
            const error = new Error('Interview not found or unauthorized');
            error.statusCode = 404;
            return next(error);
        }

        if (interview.status === 'completed') {
            const error = new Error('Completed interviews cannot be started again');
            error.statusCode = 400;
            return next(error);
        }

        if (interview.status === 'in-progress') {
            return sendResponse(res, interview, 'Interview already started');
        }

        interview.status = 'in-progress';
        interview.startedAt = new Date();
        interview.startedBy = req.user.id;
        interview.endedAt = null;
        interview.endedBy = null;

        await interview.save();

        const io = req.app.get('io');
        if (io) {
            const interviewId = interview._id.toString();
            io.to(interviewId).emit('receive-status', {
                interviewId,
                status: interview.status
            });

            io.to(interviewId).emit('interview-started', {
                interviewId,
                startedAt: interview.startedAt
            });
        }

        sendResponse(res, interview, 'Interview started successfully');
    } catch (err) {
        next(err);
    }
};

export const endInterview = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = new Error('Invalid Interview ID format');
            error.statusCode = 400;
            return next(error);
        }

        const interview = await Interview.findOne({ _id: id, owner: req.user.id });

        if (!interview) {
            const error = new Error('Interview not found or unauthorized');
            error.statusCode = 404;
            return next(error);
        }

        if (interview.status === 'completed') {
            return sendResponse(res, interview, 'Interview already ended');
        }

        interview.status = 'completed';
        interview.endedAt = new Date();
        interview.endedBy = req.user.id;

        await interview.save();

        const io = req.app.get('io');
        if (io) {
            const interviewId = interview._id.toString();
            io.to(interviewId).emit('receive-status', {
                interviewId,
                status: interview.status
            });

            io.to(interviewId).emit('interview-ended', {
                interviewId,
                endedAt: interview.endedAt
            });
        }

        sendResponse(res, interview, 'Interview ended successfully');
    } catch (err) {
        next(err);
    }
};

export const assignProblemsToInterview = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { problemIds } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = new Error('Invalid Interview ID format');
            error.statusCode = 400;
            return next(error);
        }

        const interview = await Interview.findOne({ _id: id, owner: req.user.id });

        if (!interview) {
            const error = new Error('Interview not found or unauthorized');
            error.statusCode = 404;
            return next(error);
        }

        const uniqueProblemIds = [...new Set(problemIds)];

        const validProblems = await Problem.find({
            _id: { $in: uniqueProblemIds },
            owner: req.user.id
        }).select('_id');

        if (validProblems.length !== uniqueProblemIds.length) {
            const error = new Error('One or more problems are invalid or unauthorized');
            error.statusCode = 400;
            return next(error);
        }

        const alreadyAssignedIds = new Set(interview.assignedProblems.map((item) => item.problem.toString()));
        const newAssignments = [];

        for (const problemId of uniqueProblemIds) {
            if (!alreadyAssignedIds.has(problemId.toString())) {
                newAssignments.push({
                    problem: problemId,
                    assignedBy: req.user.id,
                    assignedAt: new Date()
                });
            }
        }

        if (newAssignments.length > 0) {
            interview.assignedProblems.push(...newAssignments);
            await interview.save();
        }

        const updatedInterview = await Interview.findById(id)
            .populate('assignedProblems.problem', 'title description difficulty language starterCode topics');

        sendResponse(res, updatedInterview, 'Problems assigned successfully');
    } catch (err) {
        next(err);
    }
};

export const removeAssignedProblem = async (req, res, next) => {
    try {
        const { id, problemId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(problemId)) {
            const error = new Error('Invalid interview or problem ID format');
            error.statusCode = 400;
            return next(error);
        }

        const interview = await Interview.findOne({ _id: id, owner: req.user.id });

        if (!interview) {
            const error = new Error('Interview not found or unauthorized');
            error.statusCode = 404;
            return next(error);
        }

        const beforeCount = interview.assignedProblems.length;
        interview.assignedProblems = interview.assignedProblems.filter(
            (item) => item.problem.toString() !== problemId
        );

        if (beforeCount === interview.assignedProblems.length) {
            const error = new Error('Problem is not assigned to this interview');
            error.statusCode = 404;
            return next(error);
        }

        await interview.save();

        const updatedInterview = await Interview.findById(id)
            .populate('assignedProblems.problem', 'title description difficulty language starterCode topics');

        sendResponse(res, updatedInterview, 'Assigned problem removed successfully');
    } catch (err) {
        next(err);
    }
};

export const getInterviewProblems = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = new Error('Invalid Interview ID format');
            error.statusCode = 400;
            return next(error);
        }

        const interview = await Interview.findOne({ _id: id, $or: [{ owner: req.user.id }, { candidate: req.user.id }] })
            .populate('assignedProblems.problem', 'title description difficulty language starterCode topics');

        if (!interview) {
            const error = new Error('Interview not found or unauthorized');
            error.statusCode = 404;
            return next(error);
        }

        sendResponse(res, interview.assignedProblems, 'Interview problems fetched successfully');
    } catch (err) {
        next(err);
    }
};

export const deleteInterview = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = new Error('Invalid Interview ID format');
            error.statusCode = 400;
            return next(error);
        }

        const deletedInterview = await Interview.findOneAndDelete({ _id: id, owner: req.user.id });

        if (!deletedInterview) {
            const error = new Error('Interview not found or unauthorized');
            error.statusCode = 404;
            return next(error);
        }

        return res.status(200).json({
            success: true,
            message: 'Interview deleted'
        });
    } catch (err) {
        return next(err);
    }
};