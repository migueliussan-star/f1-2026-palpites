
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, update, get, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCCaCGK8aa6Qnru8tEcCmm9pRwZz8TOBqI",
  authDomain: "palpitometro-f1-c5a48.firebaseapp.com",
  databaseURL: "https://palpitometro-f1-c5a48-default-rtdb.firebaseio.com",
  projectId: "palpitometro-f1-c5a48",
  storageBucket: "palpitometro-f1-c5a48.firebasestorage.app",
  messagingSenderId: "160032761188",
  appId: "1:160032761188:web:4dc2f5ad9731749e418671"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export { ref, set, onValue, update, get, remove };
