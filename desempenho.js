
import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    collection,
    query,
    where,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Elemento da tabela
const tabela = document.getElementById("tabela-desempenho");

// Formata a data para o padrão brasileiro
function formatarData(data) {
    if (!data) return "--";

    const partes = data.split("-");

    if (partes.length !== 3) return data;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

// Converte horas extras decimais para HH:MM
function formatarHorasExtras(valor) {
    const minutosTotais = Math.round(Number(valor || 0) * 60);

    const horas = Math.floor(minutosTotais / 60);
    const minutos = minutosTotais % 60;

    return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;
}

// Cria uma linha da tabela
function criarLinha(registro) {
    const tr = document.createElement("tr");

    const dia = document.createElement("td");
    const entrada = document.createElement("td");
    const saida = document.createElement("td");
    const extras = document.createElement("td");

    dia.textContent = formatarData(registro.data);
    entrada.textContent = registro.entrada || "--:--";
    saida.textContent = registro.saida || "--:--";

    extras.textContent = registro.saidaAt
        ? formatarHorasExtras(registro.horasExtras)
        : "--:--";

    tr.append(dia, entrada, saida, extras);

    return tr;
}

// Exibe os registros na tabela
function exibirRegistros(registros) {
    tabela.replaceChildren();

    if (registros.length === 0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");

        td.colSpan = 4;
        td.textContent = "Nenhum registro de ponto encontrado.";
        td.style.textAlign = "center";

        tr.appendChild(td);
        tabela.appendChild(tr);

        return;
    }

    registros.forEach(registro => {
        tabela.appendChild(criarLinha(registro));
    });
}

// Verifica o usuário e busca seus registros no Firestore
onAuthStateChanged(auth, (usuario) => {

    if (!usuario) {
        window.location.href = "tela-login.html";
        return;
    }

    tabela.innerHTML = `
        <tr>
            <td colspan="4" style="text-align:center">
                Carregando registros...
            </td>
        </tr>
    `;

    const consulta = query(
        collection(db, "registros_ponto"),
        where("uid", "==", usuario.uid)
    );

    // Atualiza a tabela automaticamente quando o Firestore muda
    onSnapshot(
        consulta,
        (snapshot) => {

            const registros = [];

            snapshot.forEach(documento => {
                registros.push(documento.data());
            });

            // Mais recentes primeiro
            registros.sort((a, b) => {
                return (b.data || "").localeCompare(a.data || "");
            });

            exibirRegistros(registros);

        },
        (erro) => {
            console.error("Erro ao carregar desempenho:", erro);

            tabela.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center">
                        Não foi possível carregar os registros.
                    </td>
                </tr>
            `;

            alert(
                "Erro ao consultar os registros no Firebase: " +
                erro.message
            );
        }
    );
});

// Botão de impressão
const botaoImprimir = document.querySelector(".botao input");

if (botaoImprimir) {
    botaoImprimir.addEventListener("click", () => {
        window.print();
    });
}
