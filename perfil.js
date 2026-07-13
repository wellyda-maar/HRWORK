import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "tela-login.html";
        return;
    }

    try {

        const documento = await getDoc(doc(db, "usuarios", user.uid));

        if (!documento.exists()) {
            alert("Dados do perfil não encontrados.");
            return;
        }

        const dados = documento.data();

        document.getElementById("nome").innerText =
            dados.nome || "Não informado";

        document.getElementById("cargo").innerText =
            dados.cargo || "Não informado";

        document.getElementById("funcao").innerText =
            dados.tipo === "gestor" ? "Gestor" : "Funcionário";

        document.getElementById("email").innerText =
            dados.email || "Não informado";

        document.getElementById("telefone").innerText =
            dados.telefone || "Não informado";


        document.getElementById("departamento").innerText =
            dados.departamento || "Não informado";

        document.getElementById("matricula").innerText =
            dados.matricula || "Não informado";

        if (dados.foto) {
            document.getElementById("fotoPerfil").src = dados.foto;
        }

    } catch (erro) {

        console.log(erro);
        alert("Erro ao carregar o perfil.");

    }

});