
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// ⚠️ REMPLACEZ CES VALEURS PAR CELLES DE VOTRE CONSOLE FIREBASE
// Allez sur https://console.firebase.google.com/
// Créez un projet -> Project Settings -> General -> "Your apps" -> SDK setup and configuration
const firebaseConfig = {
  apiKey: "AIzaSyBaITth3SJ2nE160zgaD-ae5PszieyHdx4",
  authDomain: "bde-ifran-app.firebaseapp.com",
  projectId: "bde-ifran-app",
  storageBucket: "bde-ifran-app.appspot.com", // Correction: Le bucket doit finir par .appspot.com
  messagingSenderId: "703434203420",
  appId: "1:703434203420:web:24d2e5e0bd9daf45561ad9"
};

// Initialisation conditionnelle pour éviter les crashs si pas configuré
let app;
let db: any;
let auth: any;
let storage: any; // Ajout du storage

try {
    // On vérifie simplement si l'objet existe, la clé a été mise à jour par l'utilisateur
    if (firebaseConfig.apiKey) {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        storage = getStorage(app); // Initialisation du storage
        console.log("Firebase (DB, Auth, Storage) connecté ✅");
    } else {
        console.warn("Firebase non configuré. Mode Démo (LocalStorage) activé ⚠️");
    }
} catch (e) {
    console.error("Erreur init Firebase:", e);
}

export { db, auth, storage }; // Export du storage
