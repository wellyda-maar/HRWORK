
const { onCall, HttpsError } = require("firebase-functions/v2/https");

const { initializeApp } = require("firebase-admin/app");

const { getAuth } = require("firebase-admin/auth");

const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();

const db = getFirestore();
const adminAuth = getAuth();

exports.cadastrarFuncionario = onCall(async (request) => {

    // 1. Verifica se existe usuário autenticado
    if (!request.auth) {
        throw new HttpsError(
            "unauthenticated",
            "Você precisa estar autenticado."
        );
    }

    try {
        // 2. Busca o cadastro de quem está solicitando
        const gestorUID = request.auth.uid;

        const gestorRef = db.collection("usuarios").doc(gestorUID);
        const gestorSnap = await gestorRef.get();

        if (!gestorSnap.exists) {
            throw new HttpsError(
                "permission-denied",
                "Cadastro do gestor não encontrado."
            );
        }

        const gestor = gestorSnap.data();

        // 3. Confere se realmente é gestor
        if (gestor.tipo !== "gestor" || gestor.ativo === false) {
            throw new HttpsError(
                "permission-denied",
                "Somente gestores ativos podem cadastrar funcionários."
            );
        }

        // 4. Recebe os dados do formulário
        const {
            nome,
            email,
            senha,
            cargo,
            telefone,
            departamento,
            matricula
        } = request.data || {};

        // 5. Valida os campos
        if (
            !nome ||
            !email ||
            !senha ||
            !cargo ||
            !telefone ||
            !departamento ||
            !matricula
        ) {
            throw new HttpsError(
                "invalid-argument",
                "Preencha todos os campos obrigatórios."
            );
        }

        if (typeof senha !== "string" || senha.length < 6) {
            throw new HttpsError(
                "invalid-argument",
                "A senha deve ter pelo menos 6 caracteres."
            );
        }

        if (!gestor.empresa) {
            throw new HttpsError(
                "failed-precondition",
                "O cadastro do gestor não possui código de empresa."
            );
        }

        // 6. Cria o funcionário no Authentication
        const novoUsuario = await adminAuth.createUser({
            email: String(email).trim(),
            password: senha,
            displayName: String(nome).trim()
        });

        try {
            // 7. Salva os dados no Firestore
            await db.collection("usuarios").doc(novoUsuario.uid).set({
                nome: String(nome).trim(),
                email: String(email).trim(),
                cargo: String(cargo).trim(),
                empresa: gestor.empresa,
                telefone: String(telefone).trim(),
                departamento: String(departamento).trim(),
                matricula: String(matricula).trim(),
                tipo: "funcionario",
                ativo: true,
                criadoEm: FieldValue.serverTimestamp()
            });

        } catch (erroFirestore) {
            // Se não conseguir salvar, remove a conta recém-criada
            await adminAuth.deleteUser(novoUsuario.uid);
            throw erroFirestore;
        }

        return {
            sucesso: true,
            uid: novoUsuario.uid,
            mensagem: "Funcionário cadastrado com sucesso!"
        };

    } catch (erro) {
        console.error("Erro ao cadastrar funcionário:", erro);

        if (erro instanceof HttpsError) {
            throw erro;
        }

        if (erro.code === "auth/email-already-exists") {
            throw new HttpsError(
                "already-exists",
                "Este e-mail já está cadastrado."
            );
        }

        throw new HttpsError(
            "internal",
            "Não foi possível cadastrar o funcionário."
        );
    }
});
