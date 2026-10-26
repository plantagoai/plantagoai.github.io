import { initializeApp } from "firebase/app";
import { initializeAppCheck, getToken, ReCaptchaEnterpriseProvider } from "firebase/app-check";

/* Firestore in the plantagoai project enforces App Check, so even public
   reads need an App Check token. Same web app and reCAPTCHA Enterprise key
   as plantagoai.com (site/src/lib/firebase.ts); the key must list
   dagangilat.com among its allowed domains. */
const app = initializeApp({
  apiKey: "AIzaSyCWlgle2BC9_vvvfDfRPQ3q63l4CHmkCOA",
  authDomain: "plantagoai.firebaseapp.com",
  projectId: "plantagoai",
  appId: "1:536032088270:web:4ec0fd651c9d196f31009f",
});

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider("6LeoMcMsAAAAAH1rSpp_iIhQKS_s09JbQPlHRYtl"),
  isTokenAutoRefreshEnabled: false,
});

/** Headers for a Firestore REST call; empty if no token could be had. A
    blocked reCAPTCHA script can leave getToken pending forever, so give up
    after a few seconds rather than hold the page. */
export async function appCheckHeaders(): Promise<Record<string, string>> {
  const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 4000));
  try {
    const { token } = await Promise.race([getToken(appCheck), timeout]);
    return { "X-Firebase-AppCheck": token };
  } catch {
    return {};
  }
}
