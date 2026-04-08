import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid"; // You'll need to run: npm install uuid

export const runCode = async (req, res, next) => {
    const { language, code, interviewId } = req.body;

    if (!code) {
        const error = new Error("No code provided");
        error.statusCode = 400;
        return next(error);
    }

    const fileName = `${uuidv4()}.${language === 'javascript' ? 'js' : 'py'}`;
    const filePath = path.join(process.cwd(), "temp", fileName);

    try {
        if (!fs.existsSync("temp")) fs.mkdirSync("temp");

        fs.writeFileSync(filePath, code);

        const command = language === "javascript" ? `node "${filePath}"` : `python "${filePath}"`;

        exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

            const output =
                error && error.killed
                    ? "Execution Timed Out (Infinite loop?)"
                    : stdout || stderr || "Code executed with no output.";

            const io = req.app.get("io");
            if (io && interviewId) {
                io.to(interviewId).emit("receive-output", { interviewId, output });
            }

            if (error && error.killed) {
                return res.status(400).json({ success: false, output });
            }
            
            res.status(200).json({
                success: true,
                output
            });
        });

    } catch (err) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        next(err);
    }
};