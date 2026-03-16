// server/firebase.ts
// Firebase Admin SDK initialization - SAFE: Never crashes the server

import admin from 'firebase-admin';

let isInitialized = false;

// Initialize Firebase Admin in a completely safe way
function initializeFirebase(): boolean {
    // Already initialized
    if (admin.apps.length > 0) {
        isInitialized = true;
        return true;
    }

    const firebaseEnv = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!firebaseEnv) {
        console.warn("⚠️ Firebase Admin NOT initialized. FIREBASE_SERVICE_ACCOUNT env var is missing.");
        return false;
    }

    try {
        let serviceAccount: any;

        // Try to parse the JSON - handle various formats
        try {
            // First, try direct JSON parse
            serviceAccount = JSON.parse(firebaseEnv);
        } catch (parseError) {
            // Maybe it's double-escaped or has issues
            console.warn("[Firebase] First parse attempt failed, trying cleanup...");
            try {
                // Try removing outer quotes if present
                let cleaned = firebaseEnv.trim();
                if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
                    cleaned = cleaned.slice(1, -1);
                }
                // Try unescaping
                cleaned = cleaned.replace(/\\"/g, '"');
                serviceAccount = JSON.parse(cleaned);
            } catch (secondError) {
                console.error("❌ Firebase: Failed to parse FIREBASE_SERVICE_ACCOUNT. Check the JSON format.");
                console.error("   Error:", secondError);
                return false;
            }
        }

        // Validate required fields
        if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
            console.error("❌ Firebase: Service account JSON is missing required fields (project_id, private_key, or client_email)");
            return false;
        }

        // Fix private_key newlines - handle both escaped and double-escaped
        if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key
                .replace(/\\\\n/g, '\n')  // Double-escaped
                .replace(/\\n/g, '\n');    // Single-escaped
        }

        // Initialize Firebase Admin
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        console.log("✅ Firebase Admin Initialized successfully.");
        return true;

    } catch (error: any) {
        console.error("❌ Firebase Admin initialization failed:", error.message);
        return false;
    }
}

// Initialize on module load (but safely)
isInitialized = initializeFirebase();

export async function sendPushNotification(fcmToken: string, payload: {
    type: 'ORDER_REQUEST' | 'ORDER_UPDATE';
    title?: string;
    body?: string;
    data?: Record<string, string>;
}): Promise<{ success: boolean; messageId?: string; error?: any }> {

    if (!isInitialized) {
        console.warn(`[FCM Mock] Push to ${fcmToken?.substring(0, 20)}...:`, payload.type);
        return { success: false, error: "Firebase not initialized" };
    }

    try {
        const message: admin.messaging.Message = {
            token: fcmToken,
            data: {
                type: payload.type,
                ...(payload.data || {})
            },
            android: {
                priority: 'high',
            }
        };

        // Include notification payload for ALL types so system tray shows rich info
        if (payload.title || payload.body) {
            message.notification = {
                title: payload.title,
                body: payload.body,
            };
            message.android!.notification = {
                channelId: payload.type === 'ORDER_REQUEST' ? 'order_alerts' : 'fcm_default_channel',
                priority: 'max',
                defaultSound: true,
                defaultVibrateTimings: true,
                visibility: 'public',
                clickAction: 'OPEN_PROVIDER_DASHBOARD',
            };
        }

        const response = await admin.messaging().send(message);
        console.log('✅ FCM sent:', response);
        return { success: true, messageId: response };

    } catch (error: any) {
        console.error('❌ FCM send error:', error.message);
        return { success: false, error: error.message };
    }
}
