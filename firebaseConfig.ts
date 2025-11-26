import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// REMPLACEZ CECI PAR VOS VRAIES CLÉS FIREBASE
// Vous les trouverez dans la console Firebase > Paramètres du projet
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "bde-ifran.firebaseapp.com",
  projectId: "bde-ifran",
  storageBucket: "bde-ifran.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

// Initialisation conditionnelle pour ne pas casser l'app si pas de clés
let app;
let auth;
let db;

try {
    // On vérifie si la config est remplie (placeholder)
    if (firebaseConfig.apiKey !== "VOTRE_API_KEY") {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        console.log("Firebase connecté avec succès");
    } else {
        console.warn("Firebase non configuré : Mode Mock activé");
    }
} catch (error) {
    console.error("Erreur init Firebase:", error);
}

export { auth, db };