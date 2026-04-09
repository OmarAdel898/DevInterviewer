import mongoose from 'mongoose';

const interviewSchema=new mongoose.Schema({
    title: { type: String, required: true },
    candidateName: { type: String, required: true },
    language: { type: String, required: true, default: 'javascript' },
    code: { type: String, default: '// Start coding here...' },
    status: { 
        type: String, 
        enum: ['pending', 'in-progress', 'completed'], 
        default: 'pending' 
    },
    focus: {
        type: String,
        required: [true, "Focus area is required (e.g., System Design)"],
        trim: true
    },
    time: {
        type: Date,
        required: [true, "Scheduled time is required"]
    },
    owner: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    candidate: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true
    },
    assignedProblems: [{
        problem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Problem',
            required: true
        },
        assignedAt: {
            type: Date,
            default: Date.now
        },
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    }],
    startedAt: {
        type: Date,
        default: null
    },
    startedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    endedAt: {
        type: Date,
        default: null
    },
    endedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    aiFeedback: {
        score: Number,
        summary: String,
        details: Object
    }
},{timestamps: true});

export const Interview=mongoose.model('Interview',interviewSchema);