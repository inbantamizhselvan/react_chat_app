import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: "chat-c29aa.firebaseapp.com",
  projectId: "chat-c29aa",
  storageBucket: "chat-c29aa.appspot.com",
  messagingSenderId: "7063973214",
  appId: "1:7063973214:web:c1458958a404f9dbbef3cf"
};
const app = initializeApp(firebaseConfig);

export const auth = getAuth();
export const db = getFirestore();
export const storage = getStorage();