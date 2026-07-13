import { auth, provider, db } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Disponibiliza as funções para o HTML
window.fazerLogin = fazerLogin;
window.loginComGoogle = loginComGoogle;


// LOGIN COM EMAIL
async function fazerLogin() {

    const empresa = document.getElementById("empresa").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;

    if (empresa === "") {
        alert("Informe o código da empresa.");
        return;
    }

    if (email === "") {
        alert("Informe o email.");
        return;
    }

    if (senha === "") {
        alert("Informe a senha.");
        return;
    }

    try {

        const usuario =
            await signInWithEmailAndPassword(auth, email, senha);

        await verificarUsuario(usuario.user.email);

    } catch (erro) {

        alert("Email ou senha incorretos.");

        console.log(erro);

    }

}


// LOGIN GOOGLE
async function loginComGoogle() {

    try {

        const resultado =
            await signInWithPopup(auth, provider);

        await verificarUsuario(resultado.user.email);

    } catch (erro) {

        alert("Erro ao entrar com Google.");

        console.log(erro);

    }

}


// VERIFICA O TIPO DE USUÁRIO
async function verificarUsuario(email) {

      console.log("Email recebido:", email);


    const consulta = query(
        collection(db, "usuarios"),
        where("email", "==", email)
    );

    const resultado = await getDocs(consulta);

    console.log("Quantidade encontrada:", resultado.size);

    if (resultado.empty) {
        alert("Usuário não cadastrado.");
        return;
    }

    const dados = resultado.docs[0].data();

    // Verifica o código da empresa
    const empresaDigitada =
        document.getElementById("empresa").value.trim();

    if (dados.empresa !== empresaDigitada) {
        alert("Código da empresa inválido.");
        return;
    }

    // Redireciona conforme o tipo
    if (dados.tipo === "gestor") {

        window.location.href = "painel-gestor.html";

    } else {

        window.location.href = "marcador-ponto.html";

    }

}