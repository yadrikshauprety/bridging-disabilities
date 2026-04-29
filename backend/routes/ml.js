import express from "express";
import { spawn } from "child_process";

const router = express.Router();

router.post("/recognize-sign", async (req, res) => {
  try {
    const landmarks = req.body.landmarks || [];
    
    // Call the Python ML Service
    const pythonProcess = spawn("python", ["ml_service.py"]);
    
    let outputData = "";
    pythonProcess.stdout.on("data", (data) => {
      outputData += data.toString();
    });

    pythonProcess.stdin.write(JSON.stringify({ landmarks }));
    pythonProcess.stdin.end();

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        return res.status(500).json({ error: "ML Service failed", code });
      }
      try {
        const jsonStart = outputData.indexOf('{');
        const jsonEnd = outputData.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1) throw new Error("No JSON found");
        
        const cleanJson = outputData.substring(jsonStart, jsonEnd + 1);
        const result = JSON.parse(cleanJson);
        
        res.json({
          success: true,
          model: "ASL-Citizen Transformer Bridge",
          transcript: result.sentence,
          confidence: result.confidence.toFixed(2),
        });
      } catch (e) {
        res.status(500).json({ error: "Failed to parse ML output" });
      }
    });

  } catch (error) {
    console.error("Error processing sign via bridge:", error);
    res.status(500).json({ error: "Failed to process sign language video." });
  }
});

export default router;
