import { auth, db } from "./firebase.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
doc,
getDoc,
collection,
query,
where,
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

const perfilSnap = await getDoc(doc(db, "usuarios", user.uid));

if (!perfilSnap.exists()) {
    alert("Seu cadastro não foi encontrado.");
    return;
}

const consulta = await getDocs(
    query(
        collection(db, "usuarios"),
        where("empresa", "==", perfilSnap.data().empresa)
    )
);

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


const menu = document.getElementById("menuLateral");
const overlay = document.getElementById("overlay");

document.getElementById("abrirMenu").onclick = () => {
    menu.classList.add("ativo");
    overlay.classList.add("ativo");
};

document.getElementById("fecharMenu").onclick = () => {
    menu.classList.remove("ativo");
    overlay.classList.remove("ativo");
};

overlay.onclick = () => {
    menu.classList.remove("ativo");
    overlay.classList.remove("ativo");
};