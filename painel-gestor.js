import { auth, db } from "./firebase.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
collection,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

onAuthStateChanged(auth, async(user)=>{

if(!user){

window.location.href="tela-login.html";
return;

}

const lista =
document.getElementById("listaFuncionarios");

lista.innerHTML="";

const consulta =
await getDocs(collection(db,"usuarios"));

consulta.forEach((doc)=>{

const dados = doc.data();

lista.innerHTML += `

<div class="funcionario">

<img src="${
dados.foto ||
'https://cdn-icons-png.flaticon.com/512/149/149071.png'
}">

<div class="info">

<h3>${dados.nome}</h3>

<p>${dados.cargo}</p>

<p>${dados.email}</p>

<p>${dados.tipo}</p>

</div>

</div>

`;

});

});