import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

// Guest-visit analytics only — this site has no admin surface, so no Auth
// init here. Writes into the plantagoai project (not this site's own
// hosting project, solanavote-devnet) by deliberate choice — see
// firestore.rules in ../../../site for the guest_visits rules.
//
// App Check IS required despite this being a "no-admin" site: Firestore
// App Check enforcement on the plantagoai project is set to ENFORCED at
// the service level, covering every collection, not just admin ones.
// Without this, every write here fails with permission-denied regardless
// of the security rules being otherwise correct (learned the hard way —
// dagangilat.com had to be added to the reCAPTCHA Enterprise key's
// allowed-domains list before this could work at all).
const firebaseConfig = {
  apiKey: "AIzaSyCWlgle2BC9_vvvfDfRPQ3q63l4CHmkCOA",
  authDomain: "plantagoai.firebaseapp.com",
  projectId: "plantagoai",
  storageBucket: "plantagoai.firebasestorage.app",
  messagingSenderId: "536032088270",
  appId: "1:536032088270:web:4ec0fd651c9d196f31009f",
};

const app = initializeApp(firebaseConfig);

initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider("6LeoMcMsAAAAAH1rSpp_iIhQKS_s09JbQPlHRYtl"),
  isTokenAutoRefreshEnabled: true,
});

export const db = getFirestore(app);
