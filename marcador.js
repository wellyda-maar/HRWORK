import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    runTransaction,
    Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    dataLocalISO,
    idRegistroHoje,
    calcularDistancia,
    obterPerfil,
    obterConfigEmpresa,
    buscarRegistroDoDia
} from "./firestore-service.js";

// ========================================
// GEOLOCALIZAÇÃO DO PONTO
// Aqui a pergunta é: "o funcionário está DENTRO da área da empresa agora?"
// É uma verificação pontual, feita só ao registrar entrada/saída.
// O rastreamento de trajetos fica em rotas.js e não se mistura com isto.
// ========================================

const TEMPO_MAXIMO_GPS_MS = 15000;   // quanto tempo esperar por uma leitura boa
const IDADE_MAXIMA_LEITURA_MS = 30000; // descarta leituras antigas

let usuarioAtual = null;
let perfilAtual = null;
let configEmpresa = null;

let mapa = null;
let marcador = null;
let areaEmpresa = null;

const el = (id) => document.getElementById(id);

function horaLocal(data) {
    return data.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}

function mensagemErroGeo(erro) {
    if (erro.code === erro.PERMISSION_DENIED) {
        return "Permita o acesso à localização para registrar o ponto.";
    }
    if (erro.code === erro.POSITION_UNAVAILABLE) {
        return "Sua localização está indisponível no momento.";
    }
    if (erro.code === erro.TIMEOUT) {
        return "A localização demorou demais. Tente novamente.";
    }
    return "Não foi possível obter sua localização.";
}

// Espera o GPS "firmar": acompanha as leituras e devolve a primeira com
// precisão aceitável. Se o tempo acabar, devolve a melhor que conseguiu
// (a validação abaixo decide se ela serve). O acompanhamento termina sempre.
function obterPosicaoPrecisa(precisaoMaxima) {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Este navegador não oferece suporte à localização."));
            return;
        }

        let melhor = null;
        let finalizado = false;
        let watchId = null;
        let temporizador = null;

        const finalizar = (acao) => {
            if (finalizado) return;
            finalizado = true;
            clearTimeout(temporizador);
            if (watchId !== null) navigator.geolocation.clearWatch(watchId);
            acao();
        };

        temporizador = setTimeout(() => {
            finalizar(() => {
                if (melhor) resolve(melhor);
                else reject(new Error("A localização demorou demais. Tente novamente."));
            });
        }, TEMPO_MAXIMO_GPS_MS);

        watchId = navigator.geolocation.watchPosition(
            (posicao) => {
                if (!melhor || posicao.coords.accuracy < melhor.coords.accuracy) {
                    melhor = posicao;
                }
                if (posicao.coords.accuracy <= precisaoMaxima) {
                    finalizar(() => resolve(posicao));
                }
            },
            (erro) => {
                finalizar(() => {
                    if (melhor) resolve(melhor);
                    else reject(new Error(mensagemErroGeo(erro)));
                });
            },
            { enableHighAccuracy: true, timeout: TEMPO_MAXIMO_GPS_MS, maximumAge: 0 }
        );
    });
}

function atualizarMapa(lat, lng, config) {
    if (!el("mapa") || !window.L) return;

    if (!mapa) {
        mapa = L.map("mapa", {
            zoomControl: false,
            attributionControl: true
        }).setView([lat, lng], 16);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap"
        }).addTo(mapa);

        marcador = L.marker([lat, lng]).addTo(mapa);
    } else {
        marcador.setLatLng([lat, lng]);
    }

    // Desenha a área permitida da empresa
    if (config && !areaEmpresa) {
        areaEmpresa = L.circle([config.latitude, config.longitude], {
            radius: config.raioMetros,
            color: "#2e7d32",
            fillOpacity: 0.12
        }).addTo(mapa);
    }

    if (areaEmpresa) {
        const limites = areaEmpresa.getBounds();
        limites.extend([lat, lng]);
        mapa.fitBounds(limites, { padding: [20, 20] });
    } else {
        mapa.setView([lat, lng], 16);
    }
}

// Lê o GPS, confere precisão, atualidade e distância até a empresa.
// Se algo estiver errado, lança um Error com a mensagem para o usuário.
async function validarLocalizacao(config) {
    const posicao = await obterPosicaoPrecisa(config.precisaoMaximaMetros);
    const { latitude, longitude, accuracy } = posicao.coords;

    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        (latitude === 0 && longitude === 0)
    ) {
        throw new Error("Localização inválida. Tente novamente.");
    }

    if (Date.now() - posicao.timestamp > IDADE_MAXIMA_LEITURA_MS) {
        throw new Error("A localização obtida está desatualizada. Tente novamente.");
    }

    atualizarMapa(latitude, longitude, config);

    if (accuracy > config.precisaoMaximaMetros) {
        throw new Error(
            `A precisão do GPS está baixa (${Math.round(accuracy)} m). ` +
            "Vá para um local aberto e tente novamente."
        );
    }

    const distancia = calcularDistancia(
        latitude,
        longitude,
        config.latitude,
        config.longitude
    );

    if (distancia > config.raioMetros) {
        throw new Error(
            `Você está fora da área permitida. Distância aproximada: ${Math.round(distancia)} m ` +
            `(limite: ${config.raioMetros} m).`
        );
    }

    return {
        latitude,
        longitude,
        precisao: Math.round(accuracy),
        distancia: Math.round(distancia)
    };
}

// Mostra o mapa assim que a tela abre (não bloqueia nada se falhar)
function mostrarPosicaoInicial() {
    obterPosicaoPrecisa(configEmpresa.precisaoMaximaMetros)
        .then((posicao) => {
            atualizarMapa(
                posicao.coords.latitude,
                posicao.coords.longitude,
                configEmpresa
            );
        })
        .catch((erro) => console.warn(erro.message));
}


// ========================================
// REGISTROS NO FIRESTORE
// ========================================

async function carregarRegistroDoDia() {
    if (!usuarioAtual) return;

    const dados = await buscarRegistroDoDia(usuarioAtual.uid);

    el("data").textContent = new Date().toLocaleDateString("pt-BR");
    el("inicio").textContent = "--:--";
    el("final").textContent = "--:--";

    if (!dados) return;

    if (dados.entradaAt) {
        el("inicio").textContent = horaLocal(dados.entradaAt.toDate());
    }
    if (dados.saidaAt) {
        el("final").textContent = horaLocal(dados.saidaAt.toDate());
    }
}

// Evita clique duplo enquanto o GPS e o Firestore trabalham
async function comBotoesBloqueados(acao) {
    const botoes = [el("btnEntrada"), el("btnSaida")].filter(Boolean);
    botoes.forEach((b) => { b.disabled = true; });

    try {
        await acao();
    } finally {
        botoes.forEach((b) => { b.disabled = false; });
    }
}

function cadastroPronto() {
    if (!usuarioAtual || !perfilAtual || !configEmpresa) {
        alert("Aguarde a confirmação do seu login.");
        return false;
    }
    return true;
}

async function registrarEntrada() {
    if (!cadastroPronto()) return;

    await comBotoesBloqueados(async () => {
        try {
            const local = await validarLocalizacao(configEmpresa);

            const agora = new Date();
            const referencia = doc(db, "registros_ponto", idRegistroHoje(usuarioAtual.uid));

            await runTransaction(db, async (transacao) => {
                const atual = await transacao.get(referencia);

                if (atual.exists() && atual.data().entradaAt) {
                    throw new Error("A entrada de hoje já foi registrada.");
                }

                transacao.set(referencia, {
                    uid: usuarioAtual.uid,
                    email: usuarioAtual.email || "",
                    nome: perfilAtual.nome || usuarioAtual.displayName || "",
                    empresa: perfilAtual.empresa || "",
                    data: dataLocalISO(agora),
                    entradaAt: Timestamp.fromDate(agora),
                    entrada: horaLocal(agora),
                    saidaAt: null,
                    saida: null,
                    horasTrabalhadas: 0,
                    horasExtras: 0,
                    latitudeEntrada: local.latitude,
                    longitudeEntrada: local.longitude,
                    precisaoEntradaM: local.precisao,
                    distanciaEntradaM: local.distancia,
                    atualizadoEm: Timestamp.fromDate(agora)
                }, { merge: true });
            });

            await carregarRegistroDoDia();
            alert("Entrada registrada e salva no sistema!");

        } catch (erro) {
            console.error("Erro ao registrar entrada:", erro);
            alert(erro.message || "Não foi possível registrar a entrada.");
        }
    });
}

async function registrarSaida() {
    if (!cadastroPronto()) return;

    await comBotoesBloqueados(async () => {
        try {
            const local = await validarLocalizacao(configEmpresa);

            const agora = new Date();
            const referencia = doc(db, "registros_ponto", idRegistroHoje(usuarioAtual.uid));

            await runTransaction(db, async (transacao) => {
                const atual = await transacao.get(referencia);

                if (!atual.exists() || !atual.data().entradaAt) {
                    throw new Error("Nenhuma entrada foi registrada hoje.");
                }

                const dados = atual.data();

                if (dados.saidaAt) {
                    throw new Error("A saída de hoje já foi registrada.");
                }

                const entrada = dados.entradaAt.toDate();

                if (agora <= entrada) {
                    throw new Error("O horário de saída precisa ser posterior à entrada.");
                }

                const horasTrabalhadas = (agora.getTime() - entrada.getTime()) / 3600000;
                const horasExtras = Math.max(0, horasTrabalhadas - 8);

                transacao.update(referencia, {
                    saidaAt: Timestamp.fromDate(agora),
                    saida: horaLocal(agora),
                    horasTrabalhadas: Number(horasTrabalhadas.toFixed(2)),
                    horasExtras: Number(horasExtras.toFixed(2)),
                    latitudeSaida: local.latitude,
                    longitudeSaida: local.longitude,
                    precisaoSaidaM: local.precisao,
                    distanciaSaidaM: local.distancia,
                    atualizadoEm: Timestamp.fromDate(agora)
                });
            });

            await carregarRegistroDoDia();
            alert("Saída registrada e salva no sistema!");

        } catch (erro) {
            console.error("Erro ao registrar saída:", erro);
            alert(erro.message || "Não foi possível registrar a saída.");
        }
    });
}

// Os botões usam onclick no HTML. Como este arquivo é um módulo,
// as funções precisam ser expostas explicitamente em window.
window.registrarEntrada = registrarEntrada;
window.registrarSaida = registrarSaida;

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "tela-login.html";
        return;
    }

    usuarioAtual = user;

    try {
        perfilAtual = await obterPerfil(user.uid);

        if (!perfilAtual) {
            alert("Seu cadastro não foi encontrado. Entre em contato com o gestor.");
            return;
        }

        configEmpresa = await obterConfigEmpresa(perfilAtual.empresa);

        await carregarRegistroDoDia();
        mostrarPosicaoInicial();

    } catch (erro) {
        console.error("Erro ao carregar o registro do dia:", erro);
        alert("Não foi possível carregar seus registros. Verifique sua conexão e as regras do Firestore.");
    }
});


// ========================================
// MENU LATERAL
// ========================================

const menu = el("menuLateral");
const overlay = el("overlay");

el("abrirMenu")?.addEventListener("click", () => {
    menu?.classList.add("ativo");
    overlay?.classList.add("ativo");
});

function fecharMenu() {
    menu?.classList.remove("ativo");
    overlay?.classList.remove("ativo");
}

el("fecharMenu")?.addEventListener("click", fecharMenu);
overlay?.addEventListener("click", fecharMenu);