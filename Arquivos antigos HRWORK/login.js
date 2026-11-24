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


// ========================================
// DISPONIBILIZA AS FUNÇÕES PARA O HTML
// ========================================

window.fazerLogin = fazerLogin;
window.loginComGoogle = loginComGoogle;


// ========================================
// LOGIN COM EMAIL E SENHA
// ========================================

async function fazerLogin() {

    const empresa = document
        .getElementById("empresa")
        .value
        .trim();

    const email = document
        .getElementById("email")
        .value
        .trim();

    const senha = document
        .getElementById("senha")
        .value;


    // Verifica campos

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

        console.log("Tentando fazer login...");
        console.log("Email:", email);


        // LOGIN NO FIREBASE AUTH

        const resultado =
            await signInWithEmailAndPassword(
                auth,
                email,
                senha
            );


        console.log("Login realizado!");
        console.log("UID:", resultado.user.uid);


        // Depois do login, procura os dados no Firestore

        await verificarUsuario(
            resultado.user.uid,
            email,
            empresa
        );


    } catch (erro) {

        console.error("ERRO COMPLETO:", erro);


        // Erros específicos do Firebase

        if (erro.code === "auth/invalid-credential") {

            alert("Email ou senha incorretos.");

        }

        else if (erro.code === "auth/user-not-found") {

            alert("Este usuário não está cadastrado no Firebase Authentication.");

        }

        else if (erro.code === "auth/wrong-password") {

            alert("A senha está incorreta.");

        }

        else if (erro.code === "auth/invalid-email") {

            alert("O email informado é inválido.");

        }

        else if (erro.code === "auth/user-disabled") {

            alert("Este usuário foi desativado.");

        }

        else {

            alert("Ocorreu um erro: " + erro.message);

        }

    }

}


// ========================================
// LOGIN COM GOOGLE
// ========================================

async function loginComGoogle() {

    try {

        console.log("Entrando com Google...");

        const resultado =
            await signInWithPopup(
                auth,
                provider
            );


        console.log("Login Google realizado!");

        await verificarUsuario(
            resultado.user.uid,
            resultado.user.email,
            document.getElementById("empresa").value.trim()
        );


    } catch (erro) {

        console.error("ERRO GOOGLE:", erro);

        alert(
            "Erro ao entrar com Google: " +
            erro.message
        );

    }

}


// ========================================
// VERIFICAR USUÁRIO NO FIRESTORE
// ========================================

async function verificarUsuario(uid, email, empresaDigitada) {

    console.log("Procurando usuário no Firestore...");
    console.log("UID:", uid);
    console.log("Email:", email);
    console.log("Empresa:", empresaDigitada);


    const consulta = query(

        collection(db, "usuarios"),

        where(
            "email",
            "==",
            email
        )

    );


    const resultado =
        await getDocs(consulta);


    console.log(
        "Usuários encontrados:",
        resultado.size
    );


    if (resultado.empty) {

        alert(
            "O login foi realizado, mas este usuário não possui cadastro na coleção usuarios."
        );

        return;
    }


    // Pega o primeiro documento encontrado

    const documento =
        resultado.docs[0];

    const dados =
        documento.data();


    console.log(
        "Dados encontrados:",
        dados
    );


    // ========================================
    // VERIFICA EMPRESA
    // ========================================

    if (dados.empresa !== empresaDigitada) {

        alert(
            "Código da empresa inválido."
        );

        return;
    }


    // ========================================
    // VERIFICA TIPO
    // ========================================

    if (dados.tipo === "gestor") {

        console.log("Usuário é GESTOR");

        localStorage.setItem(
            "tipoUsuario",
            "gestor"
        );

        window.location.href =
            "painel-gestor.html";


    } else {

        console.log("Usuário é FUNCIONÁRIO");

        localStorage.setItem(
            "tipoUsuario",
            "funcionario"
        );

        window.location.href =
            "marcador-ponto.html";

    }

}