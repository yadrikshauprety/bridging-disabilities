import twilio from "twilio";
import dotenv from "dotenv";
dotenv.config();

const sendWhatsApp = async (to, body) => {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.log(`[MOCK SOS]: ${body}`);
      return;
    }
    console.log("Using SID:", process.env.TWILIO_ACCOUNT_SID);
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const from = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";
    const toFormatted = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
    
    console.log(`Attempting to send to ${toFormatted} from ${from}...`);
    const message = await client.messages.create({ from, to: toFormatted, body });
    console.log(`SOS WhatsApp sent! SID: ${message.sid}`);
  } catch (e) {
    console.error("SOS WhatsApp Error:", e.message);
    if (e.code) console.error("Error Code:", e.code);
  }
};

// Test with the demo number
sendWhatsApp("+919019320048", "Test SOS from Antigravity");
