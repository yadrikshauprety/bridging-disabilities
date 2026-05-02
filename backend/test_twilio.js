import { sendWhatsApp } from "./utils/whatsapp.js";
import dotenv from "dotenv";
dotenv.config();

console.log("🚀 Testing Twilio WhatsApp Integration...");
console.log("Using Account SID:", process.env.TWILIO_ACCOUNT_SID);

const testNumber = process.argv[2] || "+919019320048";

const runTest = async () => {
  const result = await sendWhatsApp(testNumber, "✅ *DisabilityBridge Test*\n\nYour new Twilio account is now connected and working perfectly! You will receive UDID updates and SOS alerts on this number.");
  
  if (result.success) {
    console.log("✨ SUCCESS! Message SID:", result.sid);
    console.log("Check your WhatsApp!");
  } else {
    console.error("❌ FAILED:", result.error);
  }
};

runTest();
