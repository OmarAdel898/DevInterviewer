import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const ACCESS_EXPIRY = '1h';
const REFRESH_EXPIRY = '7d';

export const register = async (req, res, next) => {
    try {
        const { fullName, email, password, role } = req.body;
        const safeRole = role === 'interviewer' ? 'interviewer' : 'user';

        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = await User.create({
            fullName,
            email,
            password: hashedPassword,
            role: safeRole
        });

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email
            }
        });
    } catch (err) {
        next(err);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            const error = new Error('Invalid email or password');
            error.statusCode = 401;
            return next(error);
        }
        const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: ACCESS_EXPIRY });
        const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: REFRESH_EXPIRY });

        user.refreshToken = refreshToken;
        await user.save();

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            accessToken,
            user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role }
        });
    } catch (err) {
        next(err);
    }
};

export const getUserByEmail=async(req,res,next)=>{
    try{
        const{email}=req.body;
        const user=await User.findOne({email});
        if(!user){
            const error=new Error("User not found");
            error.statusCode = 404;
            return next(error);
        }
        res.status(200).json({
            success:true,
            user:{id:user._id,fullName:user.fullName,email:user.email,role:user.role}
        });
    } catch (err) {
        next(err);
    }
}
export const refreshAccessToken = async (req, res, next) => {
    try {
        const token = req.cookies?.refreshToken || req.body?.refreshToken;
        if (!token) {
            const error = new Error('No refresh token provided');
            error.statusCode = 401;
            return next(error);
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || user.refreshToken !== token) {
            const error = new Error('Invalid refresh token');
            error.statusCode = 401;
            return next(error);
        }
        const newAccessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: ACCESS_EXPIRY });

        res.status(200).json({
            success: true,
            accessToken: newAccessToken
        });
    } catch (err) {
        next(err);
    }
};

export const updateProfile = async (req, res, next) => {
    try {
        const { fullName } = req.body;

        if (typeof fullName !== 'string' || !fullName.trim()) {
            const error = new Error('Full name is required');
            error.statusCode = 400;
            return next(error);
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            return next(error);
        }

        user.fullName = fullName.trim();
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        return next(err);
    }
};