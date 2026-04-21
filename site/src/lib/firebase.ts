import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: "AIzaSyCWlgle2BC9_vvvfDfRPQ3q63l4CHmkCOA",
  authDomain: "plantagoai.firebaseapp.com",
  projectId: "plantagoai",
  storageBucket: "plantagoai.firebasestorage.app",
  messagingSenderId: "536032088270",
  appId: "1:536032088270:web:4ec0fd651c9d196f31009f",
  measurementId: "G-ZQZ012M9J6",
};

const app = initializeApp(firebaseConfig);

initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider("6LeoMcMsAAAAAH1rSpp_iIhQKS_s09JbQPlHRYtl"),
  isTokenAutoRefreshEnabled: true,
});

export const db = getFirestore(app);
export const auth = getAuth(app);
