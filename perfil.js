import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Guarda o tipo do usuário (gestor ou funcionario)
let tipoUsuario = "";

// Verifica se o usuário está logado
onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "tela-login.html";
        return;
    }

    try {

        // Busca os dados do usuário no Firestore
        const documento = await getDoc(doc(db, "usuarios", user.uid));

        if (!documento.exists()) {
            alert("Perfil não encontrado.");
            return;
        }

        const dados = documento.data();

        // Guarda o tipo do usuário
        tipoUsuario = dados.tipo;

        // Preenche a tela
        document.getElementById("nome").textContent =
            dados.nome || "Não informado";

        document.getElementById("cargo").textContent =
            dados.cargo || "Não informado";

        document.getElementById("funcao").textContent =
            dados.tipo === "gestor" ? "Gestor" : "Funcionário";

        document.getElementById("email").textContent =
            dados.email || "Não informado";

        document.getElementById("telefone").textContent =
            dados.telefone || "Não informado";

        document.getElementById("departamento").textContent =
            dados.departamento || "Não informado";

        document.getElementById("matricula").textContent =
            dados.matricula || "Não informado";

        // Foto
        if (dados.foto && dados.foto !== "") {
            document.getElementById("fotoPerfil").src = dados.foto;
        }

    } catch (erro) {

        console.error(erro);
        alert("Erro ao carregar o perfil.");

    }

});

// Função da seta voltar
function voltar() {

    if (tipoUsuario === "gestor") {

        window.location.href = "painel-gestor.html";

    } else {

        window.location.href = "marcador-ponto.html";

    }

}

// Disponibiliza a função para o HTML
window.voltar = voltar;