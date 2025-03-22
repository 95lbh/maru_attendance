// firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCXV-bdoMpFHqSfgwm6NSWWOoVGjbjVGvQ",
    authDomain: "maru-attendance.firebaseapp.com",
    projectId: "maru-attendance",
    storageBucket: "maru-attendance.firebasestorage.app",
    messagingSenderId: "606697404775",
    appId: "1:606697404775:web:63d5f871398cbf4ba617c2",
    measurementId: "G-LW3DWKRFR5"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
