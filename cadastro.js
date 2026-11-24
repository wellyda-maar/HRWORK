
import { auth, functions } from "./firebase.js";

import {
    httpsCallable
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";

// Chama a Cloud Function
const cadastrarFuncionarioCloud = httpsCallable(
    functions,
    "cadastrarFuncionario"
);

const botao = document.getElementById("cadastrar");

botao.addEventListener("click", cadastrarFuncionario);

async function cadastrarFuncionario() {

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;
    const cargo = document.getElementById("cargo").value.trim();
    const telefone = document.getElementById("telefone").value.trim();
    const departamento = document.getElementById("departamento").value.trim();
    const matricula = document.getElementById("matricula").value.trim();

    if (
        !nome ||
        !email ||
        !senha ||
        !cargo ||
        !telefone ||
        !departamento ||
        !matricula
    ) {
        alert("Preencha todos os campos.");
        return;
    }

    if (senha.length < 6) {
        alert("A senha deve ter pelo menos 6 caracteres.");
        return;
    }

    // Verifica se existe uma sessão ativa
    if (!auth.currentUser) {
        alert("Sua sessão expirou. Faça login novamente.");
        window.location.href = "tela-login.html";
        return;
    }

    try {

        botao.disabled = true;
        botao.textContent = "Cadastrando...";

        const resultado = await cadastrarFuncionarioCloud({
            nome,
            email,
            senha,
            cargo,
            telefone,
            departamento,
            matricula
        });

        alert(resultado.data.mensagem);

        // Limpa os campos após o cadastro
        document.getElementById("nome").value = "";
        document.getElementById("email").value = "";
        document.getElementById("senha").value = "";
        document.getElementById("cargo").value = "";
        document.getElementById("telefone").value = "";
        document.getElementById("departamento").value = "";
        document.getElementById("matricula").value = "";

    } catch (erro) {

        console.error("Erro ao cadastrar funcionário:", erro);

        if (erro.code === "functions/unauthenticated") {
            alert("Você precisa entrar no sistema novamente.");

        } else if (erro.code === "functions/permission-denied") {
            alert("Somente um gestor autorizado pode cadastrar funcionários.");

        } else if (erro.code === "functions/already-exists") {
            alert("Este e-mail já está cadastrado.");

        } else if (
            erro.code === "functions/invalid-argument" ||
            erro.code === "functions/failed-precondition"
        ) {
            alert(erro.message);

        } else {
            alert("Não foi possível cadastrar. Verifique sua conexão e tente novamente.");
        }

    } finally {

        botao.disabled = false;
        botao.textContent = "Cadastrar";

    }
}
