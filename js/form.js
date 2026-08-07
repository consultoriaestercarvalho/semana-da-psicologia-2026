// ============================================================
// Formulário de inscrição — validação, anti-spam, envio ao
// Google Sheets (via Apps Script) e redirecionamento ao pagamento
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-inscricao");
  if (!form) return;

  const statusBox = document.getElementById("form-status");
  const submitBtn = document.getElementById("btn-submit");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearErrors(form);
    hideStatus();

    // --- Anti-spam: honeypot ---
    // Campo invisível para humanos. Se vier preenchido, é bot.
    const honeypot = form.querySelector('[name="website"]');
    if (honeypot && honeypot.value.trim() !== "") {
      // Finge sucesso para não dar dica ao bot, mas não envia nada.
      return;
    }

    const dados = {
      nome: form.nome.value.trim(),
      email: form.email.value.trim(),
      telefone: form.telefone.value.trim(),
      curso: form.curso.value.trim(),
      periodo: form.periodo.value.trim(),
      cpf: form.cpf.value.trim(),
      dataEnvio: new Date().toISOString(),
    };

    const erros = validar(dados);
    if (erros.length > 0) {
      erros.forEach((campo) => marcarErro(form, campo));
      showStatus("error", "Verifique os campos destacados antes de continuar.");
      form.querySelector(".field.error input")?.focus();
      return;
    }

    setLoading(true);

    try {
      await enviarParaPlanilha(dados);

      // Guarda os dados localmente para a página de confirmação
      sessionStorage.setItem("inscricao_dados", JSON.stringify(dados));
      sessionStorage.setItem(
        "inscricao_protocolo",
        gerarProtocolo(dados)
      );

      redirecionarParaPagamento(dados);
    } catch (err) {
      console.error(err);
      showStatus(
        "error",
        "Não foi possível enviar sua inscrição agora. Tente novamente em instantes."
      );
      setLoading(false);
    }
  });

  // ---------------- Funções auxiliares ----------------

  function validar(dados) {
    const erros = [];

    if (dados.nome.length < 5 || !dados.nome.includes(" ")) {
      erros.push("nome");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)) {
      erros.push("email");
    }

    if (dados.telefone.replace(/\D/g, "").length < 10) {
      erros.push("telefone");
    }

    if (dados.curso.length < 2) {
      erros.push("curso");
    }

    if (!validarCPF(dados.cpf)) {
      erros.push("cpf");
    }

    return erros;
  }

  function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, "");
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (10 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    if (resto !== parseInt(cpf[9])) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(cpf[i]) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    return resto === parseInt(cpf[10]);
  }

  function marcarErro(form, campo) {
    const field = form.querySelector(`[data-field="${campo}"]`);
    field?.classList.add("error");
  }

  function clearErrors(form) {
    form.querySelectorAll(".field.error").forEach((f) => f.classList.remove("error"));
  }

  function showStatus(tipo, mensagem) {
    if (!statusBox) return;
    statusBox.textContent = mensagem;
    statusBox.className = `form-status is-visible ${tipo}`;
  }

  function hideStatus() {
    if (!statusBox) return;
    statusBox.className = "form-status";
  }

  function setLoading(isLoading) {
    if (!submitBtn) return;
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? "Enviando..." : "Continuar para pagamento";
  }

  function gerarProtocolo(dados) {
    const timestamp = Date.now().toString(36).toUpperCase();
    return `SP2026-${timestamp}`;
  }

  async function enviarParaPlanilha(dados) {
    const url = CONFIG.googleSheets.scriptUrl;

    // Se a URL do Apps Script ainda não foi configurada, apenas
    // avisa no console e segue o fluxo (não trava o cadastro).
    if (!url) {
      console.warn(
        "CONFIG.googleSheets.scriptUrl não configurada — dados não foram enviados à planilha."
      );
      return;
    }

    // Envia como application/x-www-form-urlencoded, que o Apps Script
    // recebe de forma confiável mesmo em modo no-cors (diferente de JSON,
    // que às vezes chega sem "postData" preenchido).
    const corpo = new URLSearchParams(dados).toString();

    await fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: corpo,
    });
  }

  function redirecionarParaPagamento(dados) {
    const checkoutUrl = CONFIG.infinityPay.checkoutUrl;

    if (!checkoutUrl) {
      // Enquanto a Infinity Pay não estiver configurada, segue
      // direto para a página de confirmação (modo de teste).
      window.location.href = "confirmacao.html";
      return;
    }

    // Alguns links de checkout aceitam parâmetros de referência.
    // Ajuste conforme a documentação da Infinity Pay, se necessário.
    const separador = checkoutUrl.includes("?") ? "&" : "?";
    const referencia = encodeURIComponent(
      sessionStorage.getItem("inscricao_protocolo") || ""
    );
    window.location.href = `${checkoutUrl}${separador}ref=${referencia}`;
  }
});
