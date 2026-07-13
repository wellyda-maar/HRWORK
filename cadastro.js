import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const botao = document.getElementById("cadastrar");

botao.addEventListener("click", cadastrarFuncionario);

async function cadastrarFuncionario() {

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;
    const cargo = document.getElementById("cargo").value.trim();
    const empresa = document.getElementById("empresa").value.trim();
    const telefone = document.getElementById("telefone").value.trim();
    const departamento = document.getElementById("departamento").value.trim();
    const matricula = document.getElementById("matricula").value.trim();
    const tipo = document.getElementById("tipo").value;

    if (
        nome === "" ||
        email === "" ||
        senha === "" ||
        cargo === "" ||
        empresa === "" ||
        telefone === "" ||
        departamento === "" ||
        matricula === ""
    ) {
        alert("Preencha todos os campos.");
        return;
    }

    try {

        // Cria o usuário no Firebase Authentication
        const credencial = await createUserWithEmailAndPassword(
            auth,
            email,
            senha
        );

        const uid = credencial.user.uid;

        // Salva os dados no Firestore
        await setDoc(doc(db, "usuarios", uid), {

            nome: nome,
            email: email,
            cargo: cargo,
            empresa: empresa,
            telefone: telefone,
            departamento: departamento,
            matiicula: matricula,
            tipo: tipo

        });

        alert("Funcionário cadastrado com sucesso!");

        document.getElementById("nome").value = "";
        document.getElementById("email").value = "";
        document.getElementById("senha").value = "";
        document.getElementById("cargo").value = "";
        document.getElementById("empresa").value = "";
        document.getElementById("telefone").value = "";
        document.getElementById("departamento").value = "";
        document.getElementById("matricula").value = "";
        document.getElementById("tipo").value = "funcionario";

    } catch (erro) {

        console.log(erro);

        if (erro.code === "auth/email-already-in-use") {
            alert("Este e-mail já está cadastrado.");
        } else if (erro.code === "auth/weak-password") {
            alert("A senha deve ter pelo menos 6 caracteres.");
        } else {
            alert("Erro ao cadastrar: " + erro.message);
        }

    }

}