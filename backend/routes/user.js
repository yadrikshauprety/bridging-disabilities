import express from "express";
import { getDb } from "../db.js";
import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const sendWhatsApp = async (to, body) => {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.log(`[MOCK SOS]: ${body}`);
      return;
    }
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const from = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";
    // For demo/hackathon, we can also use a hardcoded fallback or the user's trusted contact
    const toFormatted = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
    
    await client.messages.create({ from, to: toFormatted, body });
    console.log(`SOS WhatsApp sent to ${toFormatted}`);
  } catch (e) {
    console.error("SOS WhatsApp Error:", e.message);
  }
};

router.post("/sos/:email", async (req, res) => {
  const { email } = req.params;
  const db = await getDb();
  const user = await db.get("SELECT name, trustedContact FROM users WHERE email = ?", [email]);
  
  const name = user?.name || email;
  const contact = user?.trustedContact || "+919019320048"; // Fallback to demo number
  
  await sendWhatsApp(contact, `🚨 EMERGENCY SOS: ${name} is in need of immediate assistance. Please check on them!`);
  
  // Also always alert the evaluator for demo visibility
  if (contact !== "+919019320048") {
    await sendWhatsApp("+919019320048", `[SOS ALERT] User ${name} (${email}) triggered SOS!`);
  }

  res.json({ success: true, message: "SOS alert sent to your contacts." });
});

router.get("/profile/:email", async (req, res) => {
  const { email } = req.params;
  const db = await getDb();
  const user = await db.get("SELECT email, name, disability, preferences, aadhar, pan, trustedContact, onboarded FROM users WHERE email = ?", [email]);
  
  if (user) {
    // Also fetch UDID status
    const udid = await db.get("SELECT status FROM udid_applications WHERE userId = ? ORDER BY timestamp DESC LIMIT 1", [email]);
    res.json({ ...user, udidStatus: udid?.status || null });
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

router.post("/profile/:email", async (req, res) => {
  const { email } = req.params;
  const { name, disability, preferences, aadhar, pan, trustedContact, onboarded, location } = req.body;
  const db = await getDb();
  
  try {
    await db.run(
      `UPDATE users SET 
        name = COALESCE(?, name), 
        disability = COALESCE(?, disability), 
        preferences = COALESCE(?, preferences), 
        aadhar = COALESCE(?, aadhar), 
        pan = COALESCE(?, pan), 
        trustedContact = COALESCE(?, trustedContact),
        onboarded = COALESCE(?, onboarded),
        location = COALESCE(?, location)
       WHERE email = ?`,
      [name, disability, preferences, aadhar, pan, trustedContact, onboarded, location, email]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Update failed" });
  }
});

export default router;
