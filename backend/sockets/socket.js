import { Server } from "socket.io";
import jwt from 'jsonwebtoken';
import { Interview } from '../models/interview.model.js';

const setupSocket = (server) => {
    const allowedOrigins = process.env.CLIENT_URL
        ? process.env.CLIENT_URL.split(',').map((origin) => origin.trim())
        : ['http://localhost:4200'];

    const io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.use((socket, next) => {
        try {
            const token = socket.handshake?.auth?.token;

            if (!token) {
                return next(new Error('Not authorized'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.data.userId = decoded.id;
            return next();
        } catch (err) {
            return next(new Error('Token failed'));
        }
    });

    io.on("connection", (socket) => {
        console.log("A user connected:", socket.id);

        socket.on("join-interview", async (interviewId) => {
            try {
                if (!interviewId) {
                    socket.emit('socket-error', { message: 'Interview ID is required' });
                    return;
                }

                const interview = await Interview.findById(interviewId).select('owner candidate');
                if (!interview) {
                    socket.emit('socket-error', { message: 'Interview not found' });
                    return;
                }

                const userId = socket.data.userId?.toString();
                const isOwner = interview.owner?.toString() === userId;
                const isCandidate = interview.candidate?.toString() === userId;

                if (!isOwner && !isCandidate) {
                    socket.emit('socket-error', { message: 'Unauthorized room join' });
                    return;
                }

                socket.join(interviewId);
                console.log(`User ${socket.id} joined room: ${interviewId}`);
            } catch (err) {
                socket.emit('socket-error', { message: 'Unable to join interview room' });
            }
        });

        socket.on("code-change", ({ interviewId, code }) => {
            if (!interviewId || !socket.rooms.has(interviewId)) {
                return;
            }

            socket.to(interviewId).emit("receive-code", code);
        });

        socket.on("run-code", ({ interviewId, code }) => {
            if (!interviewId || !socket.rooms.has(interviewId)) {
                return;
            }

            socket.to(interviewId).emit("execute-code", code);
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });

    return io;
};

export default setupSocket;