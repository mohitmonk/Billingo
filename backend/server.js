import express from "express";
import twilio from "twilio";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import winston from "winston";
import validator from "validator";

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_PHONE_NUMBER",
];
const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 5000; // Use Render's assigned port

// Configure logging with winston
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

// Middleware
app.use(cors()); // Allow all origins (no authentication)
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/send-sms", limiter);

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(accountSid, authToken);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

// API endpoint to send SMS
app.post("/send-sms", async (req, res) => {
  const { phoneNumber, billUrl } = req.body;

  // Input validation
  if (!phoneNumber || !billUrl) {
    logger.warn(`Missing required fields: phoneNumber=${phoneNumber}, billUrl=${billUrl}`);
    return res.status(400).json({ error: "Phone number and bill URL are required." });
  }

  // Validate phone number (should start with + followed by country code and number)
  if (!validator.isMobilePhone(phoneNumber, "any", { strictMode: true })) {
    logger.warn(`Invalid phone number: ${phoneNumber}`);
    return res.status(400).json({ error: "Invalid phone number format. Use E.164 format (e.g., +91xxxxxxxxxx)." });
  }

  // Validate bill URL
  if (!validator.isURL(billUrl)) {
    logger.warn(`Invalid bill URL: ${billUrl}`);
    return res.status(400).json({ error: "Invalid bill URL format." });
  }

  try {
    const message = await client.messages.create({
      body: `Here is your digital bill: ${billUrl}`,
      from: twilioNumber,
      to: phoneNumber,
    });

    logger.info(`SMS sent successfully: SID=${message.sid}, To=${phoneNumber}`);
    res.status(200).json({ message: "SMS sent successfully!", sid: message.sid });
  } catch (error) {
    logger.error(`Error sending SMS to ${phoneNumber}: ${error.message}`);
    res.status(500).json({ error: "Failed to send SMS: " + error.message });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}, Path: ${req.path}, IP: ${req.ip}`);
  res.status(500).json({ error: "Internal server error" });
});

// Start the server
app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
