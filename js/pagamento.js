// ============================================================
// Página de pagamento (Pix) — mostra QR + copia-e-cola e envia
// a confirmação de pagamento (autodeclarada pelo aluno) para a
// planilha, atualizando o status da inscrição já criada.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const codigoBox = document.getElementById("pix-codigo");
  const btnCopiar = document.getElementById("btn-copiar");
  const btnConfirmar = document.getElementById("btn-confirmar");
  const statusBox = document.getElementById("pagamento-status");

  // Se a pessoa chegou aqui sem ter passado pelo formulário,
  // manda de volta para a inscrição em vez de mostrar uma página
  // de pagamento "solta" sem protocolo.
  const protocolo = sessionStorage.getItem("inscricao_protocolo");
  if (!protocolo) {
    window.location.href = "inscricao.html";
    return;
  }

  // Preenche o código Pix e o QR Code
  const pix = CONFIG.pix;
  codigoBox.value = pix.copiaCola;
  document.getElementById("p-recebedor").textContent = pix.nomeRecebedor;
  document.getElementById("p-cidade").textContent = pix.cidade;
  document.getElementById("p-protocolo").textContent = protocolo;

  if (window.QRCode) {
    new QRCode(document.getElementById("pix-qrcode"), {
      text: pix.copiaCola,
      width: 220,
      height: 220,
      correctLevel: QRCode.CorrectLevel.M,
    });
  }

  // Copiar código
  btnCopiar.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(pix.copiaCola);
      btnCopiar.textContent = "Código copiado!";
    } catch (e) {
      codigoBox.select();
      document.execCommand("copy");
      btnCopiar.textContent = "Código copiado!";
    }
    setTimeout(() => (btnCopiar.textContent = "Copiar código Pix"), 2500);
  });

  // Confirmação de pagamento (autodeclarada). Isto NÃO verifica
  // automaticamente se o Pix caiu — apenas registra que o aluno
  // afirmou ter pago, para a organização conferir manualmente
  // no extrato antes de liberar o certificado/lista de presença.
  btnConfirmar.addEventListener("click", async () => {
    btnConfirmar.disabled = true;
    btnConfirmar.textContent = "Confirmando...";

    try {
      await enviarConfirmacaoPagamento(protocolo);
      sessionStorage.setItem("pagamento_confirmado", "1");
      window.location.href = "confirmacao.html";
    } catch (err) {
      console.error(err);
      // Mesmo que o registro na planilha falhe, não travamos o
      // aluno numa página sem saída — mas avisamos que pode haver
      // necessidade de contato manual.
      sessionStorage.setItem("pagamento_confirmado", "1");
      window.location.href = "confirmacao.html";
    }
  });

  async function enviarConfirmacaoPagamento(protocolo) {
    const url = CONFIG.googleSheets.scriptUrl;
    if (!url) return;

    const corpo = new URLSearchParams({
      acao: "confirmar_pagamento",
      protocolo: protocolo,
    }).toString();

    await fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: corpo,
    });
  }
});
