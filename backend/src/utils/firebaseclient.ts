// src/lib/firebaseClient.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
 apiKey: "AIzaSyBPzcA6fFXfrtMoIpvIPuVkWmf9FQkhSWc",
 authDomain: "pitstop-15c0d.firebaseapp.com",
 projectId: "pitstop-15c0d",
 storageBucket: "pitstop-15c0d.appspot.com",
 messagingSenderId: "532643822779",
 appId: "1:532643822779:web:186fcf6cda5b58de323d9e",
 measurementId: "G-8K6S6MSM9B",
};

// Prevent reinitialization in Next.js hot reload
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);