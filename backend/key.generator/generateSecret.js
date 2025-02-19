import crypto from "crypto";
import fs from "fs";

const secretKey = crypto.randomBytes(32).toString("hex");
const envPath = ".env";

// Append or update the .env file
const envContent = `JWT_SECRET=${secretKey}\n`;

// Write to .env file (Overwrite or create if not exists)
fs.writeFileSync(envPath, envContent, { flag: "w" });

console.log("JWT Secret Key generated and saved to .env file.");
console.log("Key:", secretKey);
