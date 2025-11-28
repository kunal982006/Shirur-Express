// server/twilio-client.ts (DEBUGGING LOGS ADDED)

import twilio from 'twilio';

let connectionSettings: any;

// Helper function to log with context
const log = (message: string) => console.log(`[TwilioClient] ${message}`);

async function getCredentials() {
  log("Attempting to get credentials...");

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  // --- DEBUG LOGS ---
  // Check for local environment variables first
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    log("✅ Found local Twilio credentials.");
    return {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      apiKey: process.env.TWILIO_ACCOUNT_SID, // Using SID as API Key for local
      apiKeySecret: process.env.TWILIO_AUTH_TOKEN, // Using Auth Token as Secret for local
      phoneNumber: process.env.TWILIO_PHONE_NUMBER
    };
  }

  if (!hostname) {
    log("❌ ERROR: REPLIT_CONNECTORS_HOSTNAME environment variable is MISSING.");
    throw new Error('REPLIT_CONNECTORS_HOSTNAME not found');
  } else {
    log(`✅ Found HOSTNAME: ${hostname}`);
  }

  if (!xReplitToken) {
    log("❌ ERROR: REPL_IDENTITY or WEB_REPL_RENEWAL environment variable is MISSING.");
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  } else {
    log("✅ Found X_REPLIT_TOKEN.");
  }
  // --- END DEBUG LOGS ---

  try {
    const fetchUrl = `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=twilio`;
    log(`Fetching secrets from: ${fetchUrl}`);

    connectionSettings = await fetch(
      fetchUrl,
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    ).then(res => {
      log(`Fetch response status: ${res.status}`);
      if (!res.ok) {
        log(`❌ ERROR: Fetch failed with status ${res.status}`);
        throw new Error(`Failed to fetch credentials (${res.status})`);
      }
      return res.json();
    }).then(data => {
      log(`Raw data received: ${JSON.stringify(data)}`);
      return data.items?.[0]
    });

    if (!connectionSettings) {
      log("❌ ERROR: 'items' array in response was empty or data is invalid.");
      throw new Error('Twilio Connector data not found in response.');
    }

    log("✅ Found connection settings.");

    // Check for all required settings
    if (!connectionSettings.settings.account_sid || !connectionSettings.settings.api_key || !connectionSettings.settings.api_key_secret || !connectionSettings.settings.phone_number) {
      log("❌ ERROR: Secrets (sid, key, secret, or phone_number) are MISSING from fetched settings.");
      log(`DEBUG: SID: ${connectionSettings.settings.account_sid ? 'OK' : 'MISSING'}`);
      log(`DEBUG: API Key: ${connectionSettings.settings.api_key ? 'OK' : 'MISSING'}`);
      log(`DEBUG: API Secret: ${connectionSettings.settings.api_key_secret ? 'OK' : 'MISSING'}`);
      log(`DEBUG: Phone Number: ${connectionSettings.settings.phone_number ? 'OK' : 'MISSING'}`);
      throw new Error('Twilio not connected properly - missing secrets');
    }

    log("✅ All Twilio secrets fetched successfully.");
    return {
      accountSid: connectionSettings.settings.account_sid,
      apiKey: connectionSettings.settings.api_key,
      apiKeySecret: connectionSettings.settings.api_key_secret,
      phoneNumber: connectionSettings.settings.phone_number
    };

  } catch (fetchError: any) {
    log(`❌ FATAL ERROR during getCredentials fetch: ${fetchError.message}`);
    throw fetchError;
  }
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

    // Re-throw original error so routes.ts can see it
    throw error;
  }
}