import { Server } from "socket.io";

const setupSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*", //
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log("A user connected:", socket.id);

        socket.on("join-interview", (interviewId) => {
            socket.join(interviewId);
            console.log(`User ${socket.id} joined room: ${interviewId}`);
        });

        socket.on("code-change", ({ interviewId, code }) => {
            socket.to(interviewId).emit("receive-code", code);
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });

    return io;
};

export default setupSocket;