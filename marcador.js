
  import { auth } from "./firebase.js";
  import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "tela-login.html";
    }
  });


  
  // CONFIGURAÇÃO DA EMPRESA
const EMPRESA_LAT = -7.0772;
const EMPRESA_LNG = -41.4669;
const RAIO_PERMITIDO = 100;

let latitude = null;
let longitude = null;

// DATA
document.getElementById("data").innerHTML =
new Date().toLocaleDateString("pt-BR");

// PEGA LOCALIZAÇÃO
function pegarLocalizacao() {

    navigator.geolocation.getCurrentPosition((pos)=>{

        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;

        atualizarMapa(latitude,longitude);

    },()=>{
        alert("Não foi possível obter sua localização.");
    });

}

let mapa;
let marcador;

function atualizarMapa(lat, lng){

    if(!mapa){

        mapa = L.map('mapa', {zoomControl: false, attributionControl: false}).setView([lat, lng], 16);

        L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
                attribution:'© OpenStreetMap'
            }
        ).addTo(mapa);

        marcador = L.marker([lat,lng]).addTo(mapa);

    }else{

        marcador.setLatLng([lat,lng]);
        mapa.setView([lat,lng],16);

    }

}

// DISTÂNCIA
function calcularDistancia(lat1, lon1, lat2, lon2){

    const R = 6371000;

    const dLat=(lat2-lat1)*Math.PI/180;
    const dLon=(lon2-lon1)*Math.PI/180;

    const a=
    Math.sin(dLat/2)**2+
    Math.cos(lat1*Math.PI/180)*
    Math.cos(lat2*Math.PI/180)*
    Math.sin(dLon/2)**2;

    return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));

}

// REGISTRAR ENTRADA
function registrarEntrada(){

    if(latitude==null){
        alert("Aguardando localização...");
        return;
    }

    const distancia =
    calcularDistancia(latitude,longitude,
    EMPRESA_LAT,EMPRESA_LNG);

    if(distancia>RAIO_PERMITIDO){
        alert("Você está fora da empresa.");
        return;
    }

    const agora=new Date();

    document.getElementById("inicio").innerHTML=
    agora.toLocaleTimeString("pt-BR");

    let registros=
    JSON.parse(localStorage.getItem("registros"))||[];

    registros.push({
        dia:agora.toLocaleDateString("pt-BR"),
        entrada:agora.toLocaleTimeString("pt-BR"),
        saida:null
    });

    localStorage.setItem("registros",
    JSON.stringify(registros));

    alert("Entrada registrada!");
}

// REGISTRAR SAÍDA
function registrarSaida(){

    if(latitude==null){
        alert("Aguardando localização...");
        return;
    }

    const distancia=
    calcularDistancia(latitude,longitude,
    EMPRESA_LAT,EMPRESA_LNG);

    if(distancia>RAIO_PERMITIDO){
        alert("Você está fora da empresa.");
        return;
    }

    let registros=
    JSON.parse(localStorage.getItem("registros"))||[];

    if(registros.length==0){
        alert("Nenhuma entrada registrada.");
        return;
    }

    let ultimo=registros[registros.length-1];

    if(ultimo.saida){
        alert("A saída já foi registrada.");
        return;
    }

    const agora=new Date();

    ultimo.saida=
    agora.toLocaleTimeString("pt-BR");

    document.getElementById("final").innerHTML=
    ultimo.saida;

    // Horas trabalhadas
    const entrada=new Date(`${ultimo.dia} ${ultimo.entrada}`);

    const horas=(agora-entrada)/(1000*60*60);

    ultimo.horasExtras=horas>8?
    (horas-8).toFixed(2):0;

    localStorage.setItem("registros",
    JSON.stringify(registros));

    alert("Saída registrada!");
}

window.onload=pegarLocalizacao;


const menu = document.getElementById("menuLateral");
const overlay = document.getElementById("overlay");

document.getElementById("abrirMenu").onclick = () =>{
    menu.classList.add("ativo");
    overlay.classList.add("ativo");
}

document.getElementById("fecharMenu").onclick = () =>{
    menu.classList.remove("ativo");
    overlay.classList.remove("ativo");
}

overlay.onclick = () =>{
    menu.classList.remove("ativo");
    overlay.classList.remove("ativo");
}
