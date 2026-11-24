/* import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    getAuth,
    GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getStorage
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyAXyjcZ8obXGlcMBAPH9jJIEUfhX2HhwmY",
    authDomain: "hrwork-app.firebaseapp.com",
    projectId: "hrwork-app",
    storageBucket: "hrwork-app.firebasestorage.app",
    messagingSenderId: "1079155819444",
    appId: "1:1079155819444:web:743f913cbf112a8e1f28e1"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const storage = getStorage(app);

export {
    db,
    auth,
    provider,
    storage
}; */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    getAuth,
    GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getStorage
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";


const firebaseConfig = {
    apiKey: "AIzaSyAXyjcZ8obXGlcMBAPH9jJIEUfhX2HhwmY",
    authDomain: "hrwork-app.firebaseapp.com",
    projectId: "hrwork-app",
    storageBucket: "hrwork-app.firebasestorage.app",
    messagingSenderId: "1079155819444",
    appId: "1:1079155819444:web:743f913cbf112a8e1f28e1"
};


const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const storage = getStorage(app);


export {
    db,
    auth,
    provider,
    storage
};