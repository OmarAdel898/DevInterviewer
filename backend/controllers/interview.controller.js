import {Interview} from '../models/interview.model.js';
import {sendResponse} from '../utils/responseHandler.js';

export const createInterview=async(req,res,next)=>{
    try {
    const { title, candidateName, language } = req.body;
    const newInterview= await Interview.create({
        title,
        candidateName,
        language,
        owner:req.user.id
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
        const updated=await Interview.findOneAndUpdate({_id:id,owner:req.user.id},{code,status},{new:true});
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
        const interviews=await Interview.find({owner:req.user.id}).sort({ createdAt: -1 });
        sendResponse(res, interviews, "Interviews fetched successfully");
    }
    catch(err){
        next(err);
    }
}
