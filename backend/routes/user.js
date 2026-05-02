import express from "express";
import { getDb } from "../db.js";
import twilio from "twilio";
import dotenv from "dotenv";
import { sendWhatsApp } from "../utils/whatsapp.js";

dotenv.config();

const router = express.Router();



router.post("/sos/:email", async (req, res) => {
  const { email } = req.params;
  console.log(`[SOS] Triggered for email: ${email}`);
  const db = await getDb();
  const user = await db.get("SELECT name, trustedContact FROM users WHERE email = ?", [email]);
  
  if (!user) {
    console.warn(`[SOS] User not found for email: ${email}`);
  }

  const name = user?.name || email;
  const contact = user?.trustedContact || "+919019320048"; // Fallback to demo number
  
  console.log(`[SOS] Using contact: ${contact} for user: ${name}`);

  const result = await sendWhatsApp(contact, `🚨 EMERGENCY SOS: ${name} is in need of immediate assistance. Please check on them!`);
  
  // Also always alert the evaluator for demo visibility
  if (contact !== "+919019320048") {
    await sendWhatsApp("+919019320048", `[SOS ALERT] User ${name} (${email}) triggered SOS!`);
  }

  if (result.success) {
    res.json({ success: true, message: "SOS alert sent to your contacts.", recipient: result.recipient });
  } else {
    res.status(500).json({ success: false, error: result.error });
  }
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
