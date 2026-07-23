import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const firebaseApp =
  getApps()[0] ||
  initializeApp(
    serviceAccount
      ? { credential: cert(JSON.parse(serviceAccount)) }
      : {
          projectId:
            process.env.FIREBASE_PROJECT_ID || "yourtube-8cda9",
        }
  );

// Preserve the small API used by the auth controller while using the modular
// Firebase Admin SDK. Credentials are only needed when an auth route runs.
export default {
  auth: () => getAuth(firebaseApp),
};
