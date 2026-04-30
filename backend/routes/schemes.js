import express from "express";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.post("/match", async (req, res) => {
  const profile = req.body;
  
  // Call the Python RAG engine
  const pythonProcess = spawn("python", [
    path.join(__dirname, "../scheme_engine.py"),
    JSON.stringify(profile)
  ]);

  let resultData = "";
  let errorData = "";

  pythonProcess.stdout.on("data", (data) => {
    resultData += data.toString();
  });

  pythonProcess.stderr.on("data", (data) => {
    errorData += data.toString();
  });

  pythonProcess.on("close", (code) => {
    if (code !== 0) {
      console.error(`Python script failed with code ${code}: ${errorData}`);
      return res.status(500).json({ error: "Scheme engine failed", details: errorData });
    }

    try {
      const parsed = JSON.parse(resultData);
      if (parsed.error) {
        return res.status(500).json({ error: parsed.error });
      }
      res.json(parsed);
    } catch (e) {
      console.error("Failed to parse Python output:", resultData);
      res.status(500).json({ error: "Invalid response from scheme engine" });
    }
  });
});

export default router;
