
import admin from 'firebase-admin';

// Initialize Firebase Admin
// Expecting FIREBASE_SERVICE_ACCOUNT environment variable containing the JSON
// OR a file named service-account.json in the root (for local dev)

let isInitialized = false;

try {
    let serviceAccount: any;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        } catch (e) {
            console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT env var");
        }
    }

    // If not in env, check if we are in a dev environment and try to load from file
    // (In production/Replit, using ENV is safer, but for local user might use file)
    if (!serviceAccount) {
        try {
            // Intentionally using require to avoid static analysis issues if file doesn't exist
            // @ts-ignore
            // serviceAccount = require('../service-account.json'); 
            // Commented out to avoid crash if file missing. User must provide ENV or file.
        } catch (e) {
            // Ignore
        }
    }

    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        isInitialized = true;
        console.log("✅ Firebase Admin Initialized successfully.");
    } else {
        console.warn("⚠️ Firebase Admin NOT initialized. Missing FIREBASE_SERVICE_ACCOUNT env var.");
    }
} catch (error) {
    console.error("❌ Firebase Admin initialization failed:", error);
}

export async function sendPushNotification(fcmToken: string, payload: {
    type: 'ORDER_REQUEST' | 'ORDER_UPDATE';
    title?: string;
    body?: string;
    data?: Record<string, string>;
}) {
    if (!isInitialized) {
        console.warn(`[Mock] Push Notification to ${fcmToken}:`, payload);
        return { success: false, error: "Firebase not initialized" };
    }

    try {
        const message: admin.messaging.Message = {
            token: fcmToken,
            data: {
                type: payload.type,
                ...payload.data
            },
            android: {
                priority: 'high',
                notification: {
                    channelId: 'fcm_default_channel',
                    priority: 'max',
                    defaultSound: true,
                    defaultVibrateTimings: true,
                    visibility: 'public'
                }
            }
        };

        if (payload.title || payload.body) {
            message.notification = {
                title: payload.title,
                body: payload.body,
            }
        }

        const response = await admin.messaging().send(message);
        console.log('✅ Successfully sent FCM message:', response);
        return { success: true, messageId: response };
    } catch (error) {
        console.error('❌ Error sending FCM message:', error);
        return { success: false, error };
    }
}
