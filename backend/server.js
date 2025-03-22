const express = require("express");
const twilio = require("twilio");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const app = express();
const port = 5000;

// Middleware
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse JSON request bodies

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(accountSid, authToken);

// API endpoint to send SMS
app.post("/send-sms", async (req, res) => {
  const { phoneNumber, billUrl } = req.body;

  if (!phoneNumber || !billUrl) {
    return res.status(400).json({ error: "Phone number and bill URL are required." });
  }

  try {
    const message = await client.messages.create({
      body: `Here is your digital bill: ${billUrl}`,
      from: twilioNumber,
      to: phoneNumber,
    });

    console.log("SMS sent successfully:", message.sid);
    res.status(200).json({ message: "SMS sent successfully!", sid: message.sid });
  } catch (error) {
    console.error("Error sending SMS:", error);
    res.status(500).json({ error: "Failed to send SMS: " + error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});