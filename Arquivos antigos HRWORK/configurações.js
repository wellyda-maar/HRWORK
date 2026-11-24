document.addEventListener("DOMContentLoaded", () => {
  // carregar configurações
  document.getElementById("tema").value = localStorage.getItem("tema") || "claro";
  document.getElementById("idioma").value = localStorage.getItem("idioma") || "pt";
  document.getElementById("textoGrande").checked = localStorage.getItem("textoGrande") === "true";

  aplicarConfiguracoes();
});

// SALVAR
function salvarConfiguracoes() {
  localStorage.setItem("tema", document.getElementById("tema").value);
  localStorage.setItem("idioma", document.getElementById("idioma").value);
  localStorage.setItem("textoGrande", document.getElementById("textoGrande").checked);

  aplicarConfiguracoes();

  alert("Configurações salvas!");
}

// APLICAR TUDO
function aplicarConfiguracoes() {
  aplicarTema();
  aplicarIdioma();
  aplicarAcessibilidade();
}



//MUDAR A COR
function aplicarTema() {
  const tema = localStorage.getItem("tema");

  if (tema === "escuro") {
    document.body.style.background = "#121212";
    document.body.style.color = "white";
  } else {
    document.body.style.background = "#f5f5f5";
    document.body.style.color = "black";
  }
}



//ACESSIBILIDADE
const textos = {
  pt: {
    titulo: "Configurações"
  },
  en: {
    titulo: "Settings"
  }
};

function aplicarIdioma() {
  const idioma = localStorage.getItem("idioma") || "pt";

  document.getElementById("titulo").innerText = textos[idioma].titulo;
}




function aplicarAcessibilidade() {
  const grande = localStorage.getItem("textoGrande") === "true";

  if (grande) {
    document.body.style.fontSize = "18px";
  } else {
    document.body.style.fontSize = "14px";
  }
}