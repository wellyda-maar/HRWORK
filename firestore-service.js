import { db } from "./firebase.js";

import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { GeoPoint } from "firebase/firestore";

const latitude = Number(d.latitude);
const longitude = Number(d.longitude);

const localizacao = new GeoPoint(latitude, longitude);


// Usada só quando a empresa ainda não tem documento em "empresas/{codigo}".
export const CONFIG_PADRAO = {
    nome: "Unidade principal",
    latitude: -7.07694,
    longitude: -41.46694,
    raioMetros: 150,
    precisaoMaximaMetros: 100
};


// ========================================
// UTILITÁRIOS
// ========================================

export function dataLocalISO(data = new Date()) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}

export function idRegistroHoje(uid) {
    return `${uid}_${dataLocalISO()}`;
}

// Distância em metros entre dois pontos (fórmula de Haversine)
export function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}


// ========================================
// USUÁRIOS E EMPRESAS
// ========================================

// Retorna os dados do usuário ou null se o cadastro não existir
export async function obterPerfil(uid) {
    const snap = await getDoc(doc(db, "usuarios", uid));
    return snap.exists() ? snap.data() : null;
}

// Retorna a área permitida da empresa (coleção "empresas").
// Se o documento não existir, usa CONFIG_PADRAO.
export async function obterConfigEmpresa(codigo) {
    if (!codigo) return { ...CONFIG_PADRAO, origem: "padrao" };

    try {
        const snap = await getDoc(doc(db, "empresas", codigo));

        if (!snap.exists()) {
            console.warn(`Empresa "${codigo}" sem documento em "empresas". Usando configuração padrão.`);
            return { ...CONFIG_PADRAO, origem: "padrao" };
        }

        const geo = docData.localizacao;
        const latitude = geo.latitude;
        const longitude = geo.longitude;

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            console.warn("Empresa com latitude/longitude inválidas. Usando configuração padrão.");
            return { ...CONFIG_PADRAO, origem: "padrao" };
        }

        return {
            nome: d.nome || codigo,
            latitude,
            longitude,
            raioMetros: double(d.raioMetros) > 0
                ? double(d.raioMetros)
                : CONFIG_PADRAO.raioMetros,
            precisaoMaximaMetros: int64(d.precisaoMaximaMetros) > 0
                ? int64(d.precisaoMaximaMetros)
                : CONFIG_PADRAO.precisaoMaximaMetros,
            origem: "firestore"
        };

    } catch (erro) {
        console.warn("Não foi possível ler a empresa. Usando configuração padrão.", erro);
        return { ...CONFIG_PADRAO, origem: "padrao" };
    }
}


// ========================================
// REGISTROS DE PONTO
// ========================================

// Registro de hoje do usuário (ou null)
export async function buscarRegistroDoDia(uid) {
    const snap = await getDoc(doc(db, "registros_ponto", idRegistroHoje(uid)));
    return snap.exists() ? snap.data() : null;
}

// Consulta registros por funcionário (uid) OU por empresa (visão do gestor).
// inicio e fim são opcionais, no formato "AAAA-MM-DD".
// Exemplo: buscarRegistrosPonto({ empresa: "ABC123", inicio: "2026-11-01", fim: "2026-11-30" })
export async function buscarRegistrosPonto({ uid, empresa, inicio, fim } = {}) {
    if (!uid && !empresa) {
        throw new Error("Informe uid ou empresa para consultar os registros.");
    }

    const filtro = uid
        ? where("uid", "==", uid)
        : where("empresa", "==", empresa);

    const resultado = await getDocs(
        query(collection(db, "registros_ponto"), filtro)
    );

    // Filtro de período e ordenação feitos aqui para não exigir índice composto
    return resultado.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((r) => (!inicio || r.data >= inicio) && (!fim || r.data <= fim))
        .sort((a, b) => (b.data || "").localeCompare(a.data || ""));
}