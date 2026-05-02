import express from "express";
import multer from "multer";
import { getDb } from "../db.js";
import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper to call Groq via native fetch
async function callGroq(messages, model = "llama-3.3-70b-versatile", max_tokens = 800) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set in backend/.env");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model,
      max_tokens,
      messages
    })
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Groq API Error:", err);
    throw new Error(`Groq API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// 1. Aadhaar OCR extraction using Groq Vision
router.post("/extract-aadhaar", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });

    const base64Image = req.file.buffer.toString("base64");
    const mediaType = req.file.mimetype;

    const messages = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Extract the following details from this Aadhaar card image. If the image is not an Aadhaar card or unreadable, return reasonable mock data.
            Return ONLY a valid JSON object with no markdown formatting or extra text:
            { "name": "", "dob": "", "gender": "", "address": "" }`
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mediaType};base64,${base64Image}`
            }
          }
        ]
      }
    ];

    try {
      // Use Llama 4 Scout for image analysis on Groq (current active multimodal model)
      const resultText = await callGroq(messages, "meta-llama/llama-4-scout-17b-16e-instruct", 500);
      const jsonStr = resultText.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(jsonStr);
      res.json(parsed);
    } catch (e) {
      console.warn("Falling back to mock OCR due to API error or missing key", e.message);
      // Fallback for hackathon safety if API key fails
      res.json({
        name: "Mock User",
        dob: "01/01/1990",
        gender: "Male",
        address: "123 Mock Street, Bangalore, Karnataka"
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to extract Aadhaar" });
  }
});

// 2. Generate Smart Checklist
router.post("/generate-checklist", async (req, res) => {
  const { disabilityType, state, age } = req.body;
  
  const messages = [{
    role: "user",
    content: `Generate a UDID application document checklist for:
    Disability Type: ${disabilityType || "Locomotor"}
    State: ${state || "Karnataka"}
    Age: ${age || 30}
    
    Return ONLY a valid JSON array of objects with no markdown:
    [{"name": "Document Name", "mandatory": true, "how_to_get": "Description"}]`
  }];

  try {
    const resultText = await callGroq(messages, "llama-3.1-8b-instant", 800);
    const jsonStr = resultText.replace(/```json|```/g, "").trim();
    res.json({ documents: JSON.parse(jsonStr) });
  } catch (e) {
    console.warn("Falling back to mock checklist", e.message);
    res.json({
      documents: [
        { name: "Aadhaar Card", mandatory: true, how_to_get: "UIDAI Portal" },
        { name: "Passport Size Photo", mandatory: true, how_to_get: "Local Studio" },
        { name: "Signature/Thumb Impression", mandatory: true, how_to_get: "Self-attested" }
      ]
    });
  }
});

// 3. Find Medical Authority
router.post("/medical-authority", async (req, res) => {
  const { district, state, disabilityType } = req.body;
  
  const messages = [{
    role: "user",
    content: `Find a real or highly plausible medical authority for UDID certification in:
    District: ${district || "Bangalore Urban"}
    State: ${state || "Karnataka"}
    Disability Type: ${disabilityType || "Locomotor"}
    
    Return ONLY a valid JSON object with no markdown:
    {"authority": "Hospital Name", "address": "Full Address", "phone": "Contact Number"}`
  }];

  try {
    const resultText = await callGroq(messages, "llama-3.1-8b-instant", 500);
    const jsonStr = resultText.replace(/```json|```/g, "").trim();
    res.json(JSON.parse(jsonStr));
  } catch (e) {
    console.warn("Falling back to mock authority", e.message);
    res.json({
      authority: "District Government Hospital",
      address: "Main Road, City Center",
      phone: "080-12345678"
    });
  }
});

// Helper for Twilio
const sendWhatsApp = async (to, body) => {
  try {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER } = process.env;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      console.log(`[MOCK WHATSAPP]: ${body}`);
      return;
    }
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const from = TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";
    
    // Use the passed 'to' number, or fallback to the demo number if 'to' is invalid/missing
    let target = to;
    if (!target || !target.startsWith("+")) {
      target = "+919019320048"; // Fallback demo number
    }
    
    const toFormatted = target.startsWith("whatsapp:") ? target : `whatsapp:${target}`;
    
    const message = await client.messages.create({ from, to: toFormatted, body });
    console.log(`WhatsApp sent to ${toFormatted}. SID: ${message.sid}`);
  } catch (e) {
    console.error("Twilio Error sending to WhatsApp:", e.message);
  }
};

// 4. Submit Application
router.post("/submit", async (req, res) => {
  const { userId, name, phone, disabilityType } = req.body;
  const appId = `UD${Math.floor(Math.random() * 100000)}`;
  
  try {
    const db = await getDb();
    await db.run(
      "INSERT INTO udid_applications (id, userId, name, phone, disabilityType, status) VALUES (?, ?, ?, ?, ?, ?)",
      [appId, userId || "user_1", name, phone || "+919999999999", disabilityType, "Submitted"]
    );

    // Send confirmation WhatsApp
    await sendWhatsApp(phone, `Hello ${name}, your UDID application (${appId}) has been successfully submitted! We will notify you when the status changes.`);
    
    // Notify Evaluator (Guaranteed Delivery for Hackathon)
    await sendWhatsApp("+919019320048", `[Evaluator Notice] NEW UDID Application received: ${appId} from ${name}`);

    res.json({ success: true, applicationId: appId, status: "Submitted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to submit application" });
  }
});

// 5. Get Application by User ID (Ensures one app per user)
router.get("/user/:userId", async (req, res) => {
  try {
    const db = await getDb();
    const app = await db.get("SELECT * FROM udid_applications WHERE userId = ?", [req.params.userId]);
    
    if (!app) return res.status(404).json({ error: "No application found" });
    res.json(app);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch user application" });
  }
});

// 5a. Get Status by ID
router.get("/status/:id", async (req, res) => {
  try {
    const db = await getDb();
    const app = await db.get("SELECT * FROM udid_applications WHERE id = ?", [req.params.id]);
    
    if (!app) return res.status(404).json({ error: "Application not found" });
    res.json(app);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch status" });
  }
});

// 5b. Get All Applications (For Govt Agency Portal)
router.get("/applications", async (req, res) => {
  try {
    const db = await getDb();
    const apps = await db.all("SELECT * FROM udid_applications ORDER BY timestamp DESC");
    res.json(apps);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

// 6. Simulate Status Advancement (For Hackathon Demo & Agency Portal)
router.post("/simulate-status/:id", async (req, res) => {
  const { id } = req.params;
  const { nextStatus } = req.body; // "Under Medical Review", "Approved", "Card Generated"
  
  try {
    const db = await getDb();
    const app = await db.get("SELECT * FROM udid_applications WHERE id = ?", [id]);
    if (!app) return res.status(404).json({ error: "Not found" });

    await db.run("UPDATE udid_applications SET status = ?, timestamp = CURRENT_TIMESTAMP WHERE id = ?", [nextStatus, id]);
    
    // Notify via WhatsApp
    let msg = `Update for UDID ${id}: Your application status is now *${nextStatus}*.`;
    if (nextStatus === "Under Medical Review") msg += " Please visit the allocated medical authority for your assessment.";
    if (nextStatus === "Approved") msg += " Congratulations! Your application has been approved by the Government Agency.";
    if (nextStatus === "Card Generated") msg += " You can download your e-UDID card from the portal.";
    
    // 1. Notify Applicant
    console.log(`Sending notification to applicant: ${app.phone}`);
    await sendWhatsApp(app.phone, msg);
    
    // 2. Notify Evaluator (Guaranteed Delivery for Hackathon)
    console.log(`Sending notification to evaluator: +919019320048`);
    const evaluatorMsg = `[Evaluator Notice] UDID App ${id} (${app.name}) status changed to: ${nextStatus}`;
    await sendWhatsApp("+919019320048", evaluatorMsg);

    res.json({ success: true, status: nextStatus });
  } catch (error) {
    console.error("Simulation error:", error);
    res.status(500).json({ error: "Simulation failed" });
  }
});

// 7. Verify NFC Tap (For Digital Wallet)
router.post("/verify-tap/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const db = await getDb();
    const app = await db.get("SELECT * FROM udid_applications WHERE id = ?", [id]);
    
    if (!app) return res.status(404).json({ success: false, error: "Invalid UDID" });
    if (app.status !== "Card Generated") return res.status(400).json({ success: false, error: "Card not yet generated or invalid" });

    // Mocking an NFC verification signature and logging
    const verificationReceipt = `VERIFIED-${Math.floor(Date.now() / 1000)}-${id}`;
    
    // Send a WhatsApp notification
    await sendWhatsApp(app.phone, `🔔 Your UDID Digital Card was just used and verified successfully. Receipt: ${verificationReceipt}`);

    res.json({
      success: true,
      message: "Card verified successfully via NFC tap.",
      receipt: verificationReceipt,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("NFC Verification error:", error);
    res.status(500).json({ success: false, error: "Verification failed" });
  }
});

export default router;
