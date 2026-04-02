import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid"; // You'll need to run: npm install uuid

export const runCode = async (req, res, next) => {
    const { language, code } = req.body;

    if (!code) {
        const error = new Error("No code provided");
        error.statusCode = 400;
        return next(error);
    }

    // 1. Create a unique filename to avoid collisions
    const fileName = `${uuidv4()}.${language === 'javascript' ? 'js' : 'py'}`;
    const filePath = path.join(process.cwd(), "temp", fileName);

    try {
        // 2. Ensure temp directory exists
        if (!fs.existsSync("temp")) fs.mkdirSync("temp");

        // 3. Write code to a temporary file
        fs.writeFileSync(filePath, code);

        const command = language === "javascript" ? `node "${filePath}"` : `python "${filePath}"`;

        exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

            if (error && error.killed) {
                return res.status(400).json({ success: false, output: "Execution Timed Out (Infinite loop?)" });
            }

            res.status(200).json({
                success: true,
                output: stdout || stderr || "Code executed with no output."
            });
        });

    } catch (err) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        next(err);
    }
};