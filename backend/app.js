import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import http from "http";
import setupSocket from "./sockets/socket.js"; 
import cookieParser from 'cookie-parser';
import notFound from './middlewares/notFound.middleware.js';
import authRouter from './routes/auth.router.js'
import interviewRouter from './routes/interviews.router.js';
import compilerRouter from './routes/compiler.router.js';
import errorHandlerMiddleware from './middlewares/errorHandler.middleware.js';
const app=express();
const server = http.createServer(app);
const allowedOrigins = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map((origin) => origin.trim()) : ['http://localhost:4200'];

const io = setupSocket(server);
app.set('io', io);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

app.use('/',(req,res,next)=>{
    if(req.path==='/')res.status(200).json({message:"welcome to my api"});
    else next();});

app.use('/auth',authRouter);
app.use('/interviews', interviewRouter);
app.use('/compile',compilerRouter);

app.use(notFound);
app.use(errorHandlerMiddleware);

export default server;