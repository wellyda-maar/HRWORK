import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const lista = document.getElementById("lista");
const pesquisa = document.getElementById("pesquisa");

let pessoas = [];

// GARANTE QUE SÓ QUEM ESTÁ LOGADO VÊ A LISTA
onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "tela-login.html";
        return;
    }

    await carregarFuncionarios();
    mostrarLista();

});

// BUSCA TODOS OS FUNCIONÁRIOS CADASTRADOS NO FIRESTORE
async function carregarFuncionarios() {

    try {

        const consulta = await getDocs(collection(db, "usuarios"));

        pessoas = consulta.docs.map((doc) => doc.data());

    } catch (erro) {

        console.log(erro);
        alert("Erro ao carregar a lista de funcionários.");

    }

}

// MOSTRA A LISTA (COM FILTRO OPCIONAL)
function mostrarLista(filtro = "") {

    lista.innerHTML = "";

    pessoas
        .filter((p) =>
            (p.nome || "").toLowerCase().includes(filtro.toLowerCase())
        )
        .forEach((pessoa) => {

            const card = document.createElement("div");
            card.className = "card";

            card.innerHTML = `
                <div class="usuario">
                    <img src="${pessoa.foto || 'https://cdn-icons-png.flaticon.com/512/847/847969.png'}" width="50">
                    <div>
                        <p><strong>NOME:</strong> ${pessoa.nome || "Não informado"}</p>
                        <p><strong>FUNÇÃO:</strong> ${pessoa.cargo || "Não informado"}</p>
                    </div>
                </div>
            `;

            lista.appendChild(card);

        });

}

// BUSCA EM TEMPO REAL
pesquisa.addEventListener("input", () => {
    mostrarLista(pesquisa.value);
});

// INICIAR REUNIÃO
document.getElementById("iniciarReuniao").addEventListener("click", () => {
    window.open("https://meet.google.com/new");
});