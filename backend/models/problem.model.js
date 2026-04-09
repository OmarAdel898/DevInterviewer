import mongoose from 'mongoose';

const problemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    language: {
        type: String,
        enum: ['javascript', 'typescript', 'python', 'java', 'cpp', 'csharp'],
        required: true
    },
    starterCode: {
        type: String,
        default: ''
    },
    topics: {
        type: [String],
        default: []
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

export const Problem = mongoose.model('Problem', problemSchema);
