
import { auth, provider, db } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Disponibiliza as funções para o HTML
window.fazerLogin = fazerLogin;
window.loginComGoogle = loginComGoogle;


// LOGIN COM EMAIL E SENHA
async function fazerLogin() {
    const empresa = document.getElementById("empresa").value.trim();
    alert("Código digitado: [" + empresa + "]");
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;

    if (!empresa || !email || !senha) {
        alert("Preencha o código da empresa, o email e a senha.");
        return;
    }

    try {
        const resultado = await signInWithEmailAndPassword(
            auth,
            email,
            senha
        );

        await verificarUsuario(resultado.user, empresa);

    } catch (erro) {
        console.error("Erro no login:", erro);

        if (erro.code === "auth/invalid-credential") {
            alert("Email ou senha incorretos.");
        } else if (erro.code === "auth/user-not-found") {
            alert("Usuário não encontrado.");
        } else if (erro.code === "auth/wrong-password") {
            alert("Senha incorreta.");
        } else if (erro.code === "auth/invalid-email") {
            alert("Email inválido.");
        } else if (erro.code === "auth/user-disabled") {
            alert("Esta conta foi desativada.");
        } else {
            alert("Erro ao fazer login: " + erro.message);
        }
    }
}


// LOGIN COM GOOGLE
async function loginComGoogle() {
    const empresa = document.getElementById("empresa").value.trim();

    if (!empresa) {
        alert("Informe o código da empresa antes de entrar com Google.");
        return;
    }

    try {
        const resultado = await signInWithPopup(auth, provider);

        await verificarUsuario(resultado.user, empresa);

    } catch (erro) {
        console.error("Erro no login com Google:", erro);
        alert("Erro ao entrar com Google: " + erro.message);
    }
}


// VERIFICA O CADASTRO PELO UID
async function verificarUsuario(usuario, empresaDigitada) {
    try {
        const usuarioRef = doc(db, "usuarios", usuario.uid);
        const usuarioSnap = await getDoc(usuarioRef);

        if (!usuarioSnap.exists()) {
            await signOut(auth);

            alert(
                "Sua conta existe no Authentication, mas seu cadastro não foi encontrado no Firestore. Entre em contato com o gestor."
            );

            return;
        }

        const dados = usuarioSnap.data();
        
        console.log("Cadastro encontrado:", dados);

        // Confere a empresa
        if (dados.empresa !== empresaDigitada) {
            await signOut(auth);
            alert("Código da empresa inválido.");
            return;
        }

        // Confere se a conta está ativa
        if (dados.ativo === false) {
            await signOut(auth);
            alert("Esta conta está desativada.");
            return;
        }

        // Confere o tipo de usuário
        if (dados.tipo === "gestor") {
            localStorage.setItem("tipoUsuario", "gestor");
            window.location.href = "painel-gestor.html";

        } else if (dados.tipo === "funcionario") {
            localStorage.setItem("tipoUsuario", "funcionario");
            window.location.href = "marcador-ponto.html";

        } else {
            await signOut(auth);
            alert("Tipo de usuário inválido. Procure o administrador.");
        }

    } catch (erro) {
        console.error("Erro ao consultar usuário:", erro);

        await signOut(auth);
        alert("Não foi possível verificar seu cadastro. Tente novamente.");
    }
}
