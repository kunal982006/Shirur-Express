// server/twilio-client.ts - Clean Twilio Client for Render/Standard Hosting

import twilio from 'twilio';

// Helper function to log with context
const log = (message: string) => console.log(`[TwilioClient] ${message}`);

async function getCredentials() {
  log("Attempting to get credentials...");

  // Check for standard environment variables (works on Render, Heroku, etc.)
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    log("✅ Found Twilio credentials from environment variables.");
    return {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      apiKey: process.env.TWILIO_ACCOUNT_SID, // Using SID as API Key
      apiKeySecret: process.env.TWILIO_AUTH_TOKEN, // Using Auth Token as Secret
      phoneNumber: process.env.TWILIO_PHONE_NUMBER
    };
  }

  // If no Twilio credentials found, throw a clear error
  log("❌ ERROR: Twilio credentials not found in environment variables.");
  log("Required env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER");
  throw new Error('Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.');
}

export async function getTwilioClient() {
  log("Getting Twilio Client...");
  const { accountSid, apiKey, apiKeySecret } = await getCredentials();
  // If using local credentials, apiKey might be the SID and apiKeySecret might be the Auth Token
  // Twilio client can handle (SID, AuthToken) or (APIKey, APISecret, { accountSid })

  if (apiKey === accountSid) {
    // Local dev mode: using SID and Auth Token directly
    return twilio(accountSid, apiKeySecret);
  }

  return twilio(apiKey, apiKeySecret, {
    accountSid: accountSid
  });
}

export async function getTwilioFromPhoneNumber() {
  log("Getting Twilio Phone Number...");
  const { phoneNumber } = await getCredentials();
  return phoneNumber;
}

export async function sendBookingNotification(
  to: string,
  status: 'accepted' | 'declined',
  providerName: string,
  scheduledDate?: string
) {
  try {
    log(`Sending booking SMS to ${to} (status: ${status})`);
    const client = await getTwilioClient();
    const fromNumber = await getTwilioFromPhoneNumber();

    const message = status === 'accepted'
      ? `Good news! ${providerName} has accepted your booking${scheduledDate ? ` for ${scheduledDate}` : ''}. They will contact you soon.`
      : `${providerName} has declined your booking request. Please try booking with another provider.`;

    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: to
    });
    log(`✅ SMS sent successfully to ${to}. SID: ${result.sid}`);
    return result;
  } catch (error: any) {
    log(`❌ ERROR in sendBookingNotification: ${error.message}`);
    console.error('Error sending SMS:', error); // Original console.error
    throw error; // Re-throw original error
  }
}


// --- YEH NAYA FUNCTION ADD KIYA HAI ---
/**
 * Customer ko Service OTP SMS se bhejta hai
 */
export async function sendOtpNotification(
  to: string,
  otp: string
) {
  // --- MOCK OTP LOGIC FOR TESTING ---
  if (process.env.NODE_ENV === "test" || process.env.MOCK_OTP === "true") {
    log(`[MOCK OTP] Would send OTP ${otp} to ${to}. Skipping actual SMS.`);
    return { sid: 'mock-sms-sid', status: 'queued' };
  }

  try {
    // Ensure number has +91 prefix if not present
    let formattedTo = to;
    if (!formattedTo.startsWith('+')) {
      formattedTo = `+91${formattedTo}`;
    }

    log(`Sending OTP SMS to ${formattedTo}`);
    const client = await getTwilioClient();
    const fromNumber = await getTwilioFromPhoneNumber();

    const message = `Your service OTP for Shirur Express is ${otp}. Please share this with your technician to complete the service.`;

    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: formattedTo
    });
    log(`✅ OTP SMS sent successfully to ${formattedTo}. SID: ${result.sid}`);
    return result;
  } catch (error: any) {
    log(`❌ ERROR in sendOtpNotification: ${error.message}`);
    // Log full error object to see Twilio specific codes
    console.error('Twilio Full Error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

    // Check for specific Twilio error codes
    if (error.code === 20003) {
      console.error("Twilio Authentication Error: Check Account SID and Auth Token.");
    } else if (error.code === 21211) {
      console.error("Twilio Invalid Phone Number Error.");
    }

    // Re-throw original error so routes.ts can see it
    throw error;
  }
}