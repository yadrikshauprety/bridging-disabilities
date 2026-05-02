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
    
    // Clean the number
    let cleanTo = to || "";
    if (cleanTo.startsWith("whatsapp:")) cleanTo = cleanTo.replace("whatsapp:", "");
    
    // Fallback to demo number if invalid/missing
    if (!cleanTo || !cleanTo.startsWith("+")) {
      console.log(`[WA] Invalid number format "${to}", falling back to demo number`);
      cleanTo = "+919019320048"; 
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
