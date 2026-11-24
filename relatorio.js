import { auth, db } from "./firebase.js";
import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function formatarHoras(valor) {
    const totalMinutos = Math.round((Number(valor) || 0) * 60);
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;
    return `${horas}h ${String(minutos).padStart(2, "0")}min`;
}

onAuthStateChanged(auth, async (usuario) => {
    if (!usuario) {
        window.location.href = "tela-login.html";
        return;
    }

    try {
        const consulta = query(
            collection(db, "registros_ponto"),
            where("uid", "==", usuario.uid)
        );
        const resultado = await getDocs(consulta);

        let presencas = 0;
        let horasExtras = 0;

        resultado.forEach((documento) => {
            const registro = documento.data();
            if (registro.entradaAt) presencas += 1;
            horasExtras += Number(registro.horasExtras || 0);
        });

        document.getElementById("horasExtras").textContent =
            formatarHoras(horasExtras);
        document.getElementById("presencas").textContent = presencas;
        // Ausências dependem de uma escala/agenda de trabalho.
        // Como o projeto ainda não fornece essa informação, não inventamos um total.
        document.getElementById("ausencias").textContent = "—";
    } catch (erro) {
        console.error("Erro ao carregar relatório de ponto:", erro);
        alert("Não foi possível carregar o relatório. Verifique as regras do Firestore.");
    }
});

window.voltar = () => {
    window.location.href = "marcador-ponto.html";
};

window.irParaRelatorio = () => {
    window.location.href = "desempenho.html";
};