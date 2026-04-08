import {Interview} from '../models/interview.model.js';
import mongoose from 'mongoose';
import {sendResponse} from '../utils/responseHandler.js';
import { User } from '../models/user.model.js';

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
        const { code,status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = new Error('Invalid Interview ID format');
            error.statusCode = 400;
            return next(error);
        }

        const updatePayload = {};

        if (typeof code === 'string') {
            updatePayload.code = code;
        }

        if (typeof status === 'string') {
            updatePayload.status = status;
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

        const interview = await Interview.findOne({ _id: id, $or: [{ owner: req.user.id }, { candidate: req.user.id }] });

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