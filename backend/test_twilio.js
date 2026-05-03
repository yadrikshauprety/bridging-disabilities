import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER } = process.env;

console.log("Using SID:", TWILIO_ACCOUNT_SID);

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

client.messages
    .create({
        from: TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886',
        body: 'Twilio Integration Active! You will now receive UDID and SOS updates here.',
        to: 'whatsapp:+919019320048'
    })
    .then(message => console.log("Success! Message SID:", message.sid))
    .catch(err => console.error("Twilio Test Failed:", err.message));
