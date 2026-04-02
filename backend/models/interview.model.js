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
    owner: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    aiFeedback: {
        score: Number,
        summary: String,
        details: Object
    }
},{timestamps: true});

export const Interview=mongoose.model('Interview',interviewSchema);