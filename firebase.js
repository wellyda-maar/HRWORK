
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getFirestore,
    connectFirestoreEmulator
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    getAuth,
    GoogleAuthProvider,
    connectAuthEmulator
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getStorage
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

import {
    getFunctions,
    connectFunctionsEmulator
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAXyjcZ8obXGlcMBAPH9jJIEUfhX2HhwmY",
    authDomain: "hrwork-app.firebaseapp.com",
    projectId: "hrwork-app",
    storageBucket: "hrwork-app.firebasestorage.app",
    messagingSenderId: "1079155819444",
    appId: "1:1079155819444:web:743f913cbf112a8e1f28e1"
};

// Inicialização
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const storage = getStorage(app);
const functions = getFunctions(app);

// Conexão com os emuladores: só quando a página roda no seu computador
const emLocalhost =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1";

// Conexão com os emuladores locais
connectAuthEmulator(auth, "http://127.0.0.1:9099");

connectFirestoreEmulator(db, "127.0.0.1", 8080);

connectFunctionsEmulator(functions, "127.0.0.1", 5001);

// Exportações
export {
    app,
    db,
    auth,
    provider,
    storage,
    functions
};