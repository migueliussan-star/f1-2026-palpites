
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, update, get, remove } from "firebase/database";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";

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
const db = getDatabase(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Força a seleção de conta para evitar logins automáticos indesejados
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { 
  db, auth, googleProvider, 
  ref, set, onValue, update, get, remove, 
  signInWithPopup, signInWithRedirect, getRedirectResult, 
  signOut, onAuthStateChanged 
};
