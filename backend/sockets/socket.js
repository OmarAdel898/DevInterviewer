import { Server } from "socket.io";

const setupSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*", // In production, replace with your Angular URL
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log("A user connected:", socket.id);

        // 1. Join a specific interview room
        socket.on("join-interview", (interviewId) => {
            socket.join(interviewId);
            console.log(`User ${socket.id} joined room: ${interviewId}`);
        });

        // 2. Listen for code changes and broadcast to others in the same room
        socket.on("code-change", ({ interviewId, code }) => {
            // .to(interviewId) sends to everyone EXCEPT the sender
            socket.to(interviewId).emit("receive-code", code);
        });

        // 3. Handle disconnection
        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });

    return io;
};

export default setupSocket;