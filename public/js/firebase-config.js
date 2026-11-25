import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyAKIMq8Rqkb3Q0qczgGepL2776rnQX7gt0",
  authDomain: "lalila-8a771.firebaseapp.com",
  projectId: "lalila-8a771",
  storageBucket: "lalila-8a771.firebasestorage.app",
  messagingSenderId: "981440513634",
  appId: "1:981440513634:web:6f7bbd4b17a8f2216d333b"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
