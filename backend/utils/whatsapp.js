import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

export const sendWhatsApp = async (to, body) => {
  try {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER } = process.env;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      console.log(`[MOCK WHATSAPP]: ${body}`);
      return { success: true, mock: true };
    }

    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const from = TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";
    
    // Formatting logic: ensure it starts with + and has country code
    let cleanTo = to ? String(to).trim() : "";
    if (cleanTo.startsWith("whatsapp:")) cleanTo = cleanTo.replace("whatsapp:", "");
    
    // If it's a 10-digit number, assume India (+91)
    if (cleanTo.length === 10 && !cleanTo.startsWith("+")) {
      cleanTo = "+91" + cleanTo;
    }
    
    // Default to user's number for hackathon delivery if invalid
    if (!cleanTo || cleanTo === "undefined" || cleanTo === "null") {
      cleanTo = "+919019320048";
    }
    
    if (!cleanTo.startsWith("+")) {
      cleanTo = "+" + cleanTo;
    }
    
    const toFormatted = `whatsapp:${cleanTo}`;
    
    console.log(`[WA] Sending to ${toFormatted}...`);
    const message = await client.messages.create({ from, to: toFormatted, body });
    console.log(`[WA] Success! SID: ${message.sid}`);
    return { success: true, sid: message.sid };
  } catch (e) {
    console.error("[WA] Twilio Error:", e.message);
    return { success: false, error: e.message };
  }
};
