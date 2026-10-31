// client/src/lib/firebase.ts
// Firebase Phone Auth: sends the SMS OTP and confirms it. The resulting ID token
// is handed to our server (/api/auth/phone/verify), which owns the session.

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
  type Auth,
  type ConfirmationResult,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

export const isPhoneAuthConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let auth: Auth | null = null;

function getFirebaseAuth(): Auth {
  if (!isPhoneAuthConfigured) {
    throw new Error("Phone login is not configured. Please contact support.");
  }
  if (!auth) {
    const app: FirebaseApp = getApps()[0] ?? initializeApp(firebaseConfig);
    auth = getAuth(app);
    auth.languageCode = "en";
  }
  return auth;
}

let recaptchaVerifier: RecaptchaVerifier | null = null;

function resetRecaptcha() {
  recaptchaVerifier?.clear();
  recaptchaVerifier = null;
}

/**
 * Sends an OTP SMS to a 10-digit Indian mobile number.
 * `containerId` must be the id of an element on the page (invisible reCAPTCHA host).
 */
export async function sendOtp(phone10: string, containerId: string): Promise<ConfirmationResult> {
  const firebaseAuth = getFirebaseAuth();
  resetRecaptcha();

  // grecaptcha refuses to render twice into the same element, even after clear(),
  // so every send (including Resend OTP) gets a brand-new host element.
  const container = document.getElementById(containerId);
  if (!container) throw new Error("Something went wrong. Please refresh and try again.");
  container.innerHTML = "";
  const host = document.createElement("div");
  container.appendChild(host);

  recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, host, { size: "invisible" });

  try {
    return await signInWithPhoneNumber(firebaseAuth, `+91${phone10}`, recaptchaVerifier);
  } catch (error) {
    resetRecaptcha();
    throw new Error(friendlyFirebaseError(error));
  }
}

/** Confirms the OTP and returns a Firebase ID token for the server to verify. */
export async function confirmOtp(confirmation: ConfirmationResult, code: string): Promise<string> {
  try {
    const credential = await confirmation.confirm(code);
    const idToken = await credential.user.getIdToken();
    // Our server session is the source of truth; don't keep a parallel Firebase login.
    await signOut(getFirebaseAuth()).catch(() => {});
    return idToken;
  } catch (error) {
    throw new Error(friendlyFirebaseError(error));
  }
}

function friendlyFirebaseError(error: unknown): string {
  const code = (error as { code?: string })?.code || "";
  console.error("[Firebase Phone Auth]", code, error);
  switch (code) {
    case "auth/invalid-phone-number":
      return "Invalid phone number. Enter a 10-digit mobile number.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a while and try again.";
    case "auth/quota-exceeded":
      return "SMS limit reached for today. Please try again later.";
    case "auth/invalid-verification-code":
      return "Incorrect OTP. Please check and try again.";
    case "auth/code-expired":
      return "OTP expired. Please request a new one.";
    case "auth/captcha-check-failed":
    case "auth/invalid-app-credential":
      return `Verification check failed (${code}). Please refresh and try again.`;
    case "auth/configuration-not-found":
    case "auth/operation-not-allowed":
      return "OTP login is not enabled yet. Please use password login for now.";
    case "auth/unauthorized-domain":
      return "OTP login is not allowed on this website yet. Please use password login for now.";
    case "auth/billing-not-enabled":
      return "SMS service is not active yet. Please use password login for now.";
    case "auth/network-request-failed":
      return "Network error. Check your internet connection.";
    default:
      return (error as Error)?.message || "Something went wrong. Please try again.";
  }
}
