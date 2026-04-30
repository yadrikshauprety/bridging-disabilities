import express from "express";
import { spawn } from "child_process";
import twilio from "twilio";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// SOS WhatsApp Notification
router.post("/sos", async (req, res) => {
  const { userId, location } = req.body;
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
    console.error("Missing Twilio credentials in .env");
    return res.status(500).json({ error: "SOS service not configured properly" });
  }

  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

  try {
    const target = "+919019320048"; // Fallback demo number
    const toFormatted = `whatsapp:${target}`;
    
    const message = await client.messages.create({
      body: `🚨 EMERGENCY SOS from DisabilityBridge User ${userId || "Unknown"}\nLocation: ${location || "Not shared"}\nStatus: PWD candidate requires immediate assistance.`,
      from: TWILIO_WHATSAPP_NUMBER,
      to: toFormatted
    });
    console.log(`SOS WhatsApp sent to ${toFormatted}. SID: ${message.sid}`);
    res.json({ success: true, sid: message.sid });
  } catch (error) {
    console.error("SOS Failed:", error);
    res.status(500).json({ error: "Failed to send SOS notification: " + error.message });
  }
});

// Real-time Audio Transcription
router.post("/transcribe", upload.single("audio"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No audio file provided" });

  try {
    const formData = new FormData();
    formData.append("file", fs.createReadStream(req.file.path), {
      filename: "audio.webm",
      contentType: "audio/webm",
    });
    formData.append("model", "whisper-large-v3-turbo");

    const response = await axios.post("https://api.groq.com/openai/v1/audio/transcriptions", formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
    });

    fs.unlinkSync(req.file.path);
    res.json({ text: response.data.text });
  } catch (error) {
    console.error("Transcription failed:", error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: "Failed to transcribe audio" });
  }
});

router.post("/recognize-sign", async (req, res) => {
  try {
    const landmarks = req.body.landmarks || [];
    const pythonProcess = spawn("python", ["ml_service.py"]);
    let outputData = "";
    pythonProcess.stdout.on("data", (data) => { outputData += data.toString(); });
    pythonProcess.stdin.write(JSON.stringify({ landmarks }));
    pythonProcess.stdin.end();
    pythonProcess.on("close", (code) => {
      if (code !== 0) return res.status(500).json({ error: "ML Service failed", code });
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
      } catch (e) { res.status(500).json({ error: "Failed to parse ML output" }); }
    });
  } catch (error) {
    console.error("Error processing sign via bridge:", error);
    res.status(500).json({ error: "Failed to process sign language video." });
  }
});

export default router;
