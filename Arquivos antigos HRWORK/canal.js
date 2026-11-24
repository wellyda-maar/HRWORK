  import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


import {
 collection,
 query,
 orderBy,
 onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let tipoUsuario = "";

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "tela-login.html";
        return;
    }

    const documento = await getDoc(doc(db, "usuarios", user.uid));

    if (documento.exists()) {

        tipoUsuario = documento.data().tipo;

    }

});


const lista =
document.getElementById("listaMensagens");
const semPublicacoes = document.getElementById("semPublicacoes");


const q = query(
 collection(db, "publicacoes"),
 orderBy("data","desc")
);


onSnapshot(q, (snapshot) => {


  lista.innerHTML = "";

    if (snapshot.empty) {
        semPublicacoes.style.display = "block";
    } else {
        semPublicacoes.style.display = "none";
    }

  snapshot.forEach((doc) => {

      const dados = doc.data();


      lista.innerHTML += `
      <div style="
      background: white;
      border:1px solid #ccc;
      padding:20px;
      margin:15px;
      border-radius:15px;
      box-shadow: 0 2px 5px rgba(0,0,0,.1);
      margin-right:15px;
      ">
          <h3>${dados.autor}</h3>
          <p>${dados.mensagem}</p>
          <small>
                ${dados.data
                    ? dados.data.toDate().toLocaleString("pt-BR")
                    : ""}
            </small>
      </div>
      `;
  });

});

function voltar() {

    if (tipoUsuario === "gestor") {

        window.location.href = "painel-gestor.html";

    } else {

        window.location.href = "marcador-ponto.html";

    }

}

window.voltar = voltar;





