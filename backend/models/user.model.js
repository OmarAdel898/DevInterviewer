import mongoose from "mongoose";

const userSchema=new mongoose.Schema({
    fullName:{type:String,required:true},
    email:{type:String,required:true,unique:true},
    password:{type:String,required:true},
    role:{type:String,enum:["admin","interviewer"],default:"interviewer"},
    refreshToken:{type:String,default:""}

},{timestamps: true});

export const User=mongoose.model("User",userSchema);