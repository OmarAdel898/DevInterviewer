import dotenv from 'dotenv';
dotenv.config();

import server from "./app.js";
import mongoose from "mongoose";


const PORT=process.env.PORT||3000;
const DB_URL=process.env.DB_URL;
    
try{
    await mongoose.connect(DB_URL);
    console.log("Connected");
}catch(err){
    console.log(err.stack);
}
server.listen(PORT,()=>{
    console.log(`server running on http://127.0.0.1:${PORT}`);
});
