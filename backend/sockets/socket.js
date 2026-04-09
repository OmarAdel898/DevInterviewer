import { Server } from "socket.io";
import jwt from 'jsonwebtoken';
import { Interview } from '../models/interview.model.js';
import { User } from '../models/user.model.js';

const buildRoomParticipants = async (io, interviewId) => {
    const roomSockets = await io.in(interviewId).fetchSockets();
    const uniqueParticipants = new Map();

    for (const roomSocket of roomSockets) {
        const userId = roomSocket.data.userId?.toString() || roomSocket.id;
        const current = uniqueParticipants.get(userId);

        if (current) {
            current.connections += 1;
            continue;
        }

        uniqueParticipants.set(userId, {
            userId,
            fullName: roomSocket.data.fullName || 'Participant',
            role: roomSocket.data.role || 'user',
            connections: 1
        });
    }

    return Array.from(uniqueParticipants.values());
};

const emitRoomPresence = async (io, interviewId) => {
    try {
        const participants = await buildRoomParticipants(io, interviewId);
        io.to(interviewId).emit('receive-presence', {
            interviewId,
            participants
        });
    } catch (error) {
        console.error('Failed to emit room presence:', error.message);
    }
};

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

            User.findById(decoded.id)
                .select('fullName role')
                .then((user) => {
                    if (!user) {
                        return next(new Error('User not found'));
                    }

                    socket.data.userId = user._id.toString();
                    socket.data.fullName = user.fullName;
                    socket.data.role = user.role;
                    return next();
                })
                .catch(() => next(new Error('Token failed')));
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

                const interview = await Interview.findById(interviewId).select('owner candidate status');
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

                if (isCandidate && interview.status === 'pending') {
                    socket.emit('interview-waiting', {
                        interviewId,
                        status: 'pending',
                        message: 'Waiting for interviewer to start the interview'
                    });
                    return;
                }

                if (isCandidate && interview.status === 'completed') {
                    socket.emit('interview-ended', {
                        interviewId,
                        status: 'completed',
                        message: 'Interview already ended'
                    });
                    return;
                }

                socket.join(interviewId);
                console.log(`User ${socket.id} joined room: ${interviewId}`);
                await emitRoomPresence(io, interviewId);
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

        socket.on('leave-interview', async (interviewId) => {
            if (!interviewId || !socket.rooms.has(interviewId)) {
                return;
            }

            socket.leave(interviewId);
            await emitRoomPresence(io, interviewId);
        });

        socket.on('disconnecting', () => {
            socket.data.joinedRoomsBeforeDisconnect = [...socket.rooms].filter((roomId) => roomId !== socket.id);
        });

        socket.on("disconnect", () => {
            const joinedRooms = Array.isArray(socket.data.joinedRoomsBeforeDisconnect)
                ? socket.data.joinedRoomsBeforeDisconnect
                : [];

            for (const roomId of joinedRooms) {
                void emitRoomPresence(io, roomId);
            }

            console.log("User disconnected:", socket.id);
        });
    });

    return io;
};

export default setupSocket;