/**
 * ============================================================
 * V SEMANA DA PSICOLOGIA 2026 — Backend (Google Apps Script)
 * ============================================================
 * O que este script faz:
 *   1. Recebe os dados do formulário de inscrição do site.
 *   2. Grava uma nova linha na planilha do Google Sheets.
 *   3. Envia um e-mail de confirmação para o inscrito (via Gmail
 *      da conta que fez a implantação).
 *
 * COMO CONFIGURAR:
 *   1. Crie/abra a planilha do Google Sheets que vai receber
 *      as inscrições.
 *   2. Copie o ID da planilha a partir da URL dela. A URL tem esse formato:
 *      https://docs.google.com/spreadsheets/d/ESTE_TRECHO_AQUI_É_O_ID/edit
 *   3. Cole esse ID na constante SPREADSHEET_ID logo abaixo.
 *   4. Em script.google.com, cole este arquivo inteiro (substituindo
 *      TUDO que já estava no editor — apague o conteúdo antigo primeiro).
 *   5. Ajuste também SHEET_NAME e os dados do evento, se quiser.
 *   6. Clique em "Implantar" > "Nova implantação".
 *        - Tipo: "App da Web"
 *        - Executar como: "Eu" (sua conta)
 *        - Quem pode acessar: "Qualquer pessoa"
 *   7. Copie a URL gerada (termina em /exec) e cole em
 *      js/config.js -> CONFIG.googleSheets.scriptUrl
 *   8. Na primeira execução, o Google vai pedir autorização
 *      para o script acessar a planilha e enviar e-mails.
 *      Autorize com a conta dona da planilha.
 * ============================================================
 */

// Marca de versão — sirve só para confirmarmos que o código foi
// realmente atualizado. Não precisa fazer nada com isso.
const VERSAO_DEBUG = "v8";

// Cole aqui o ID da sua planilha (está na URL dela, entre /d/ e /edit).
const SPREADSHEET_ID = "1U1zbV-WNRTy61KcXBI5wrXVb6OGa_X1PcdBaUHSaHbQ";

// Nome da aba dentro da planilha onde as inscrições serão gravadas.
// Se a aba não existir, o script cria automaticamente na primeira execução.
const SHEET_NAME = "Inscricoes";

// Dados do evento usados no e-mail de confirmação.
const EVENTO = {
  nome: "V° Semana da Psicologia 2026",
  tema: "A Psicologia e a Revolução Tecnológica",
  datas: "26, 27 e 28 de agosto de 2026",
  local: "Faculdade Nassau (UNINASSAU)",
  valor: "R$ 30,00",
};

/**
 * Ponto de entrada chamado pelo fetch() do site (método POST).
 */
function doPost(e) {
  try {
    const dados = extrairDados(e);
    const acao = dados.acao || "inscricao";

    if (acao === "confirmar_pagamento") {
      confirmarPagamentoNaPlanilha(dados.protocolo);
      return respostaJson({ ok: true });
    }

    salvarNaPlanilha(dados);
    enviarEmailConfirmacao(dados);

    return respostaJson({ ok: true });
  } catch (erro) {
    registrarErro(erro, e);
    return respostaJson({ ok: false, erro: String(erro) });
  }
}

/**
 * Segurança extra: se por algum motivo o pedido chegar como GET
 * (ex: um redirecionamento interno do Google converteu o método),
 * tentamos processar do mesmo jeito em vez de simplesmente falhar.
 */
function doGet(e) {
  registrarErro(new Error("Pedido chegou como GET, não POST — " + VERSAO_DEBUG), e);
  return respostaJson({
    ok: false,
    aviso: "Este endpoint espera POST. Recebido GET.",
  });
}

/**
 * Extrai os dados do pedido, aceitando tanto formulário
 * (application/x-www-form-urlencoded, em e.parameter) quanto
 * JSON (em e.postData.contents), para máxima compatibilidade.
 */
function extrairDados(e) {
  if (e && e.parameter && Object.keys(e.parameter).length > 0) {
    return e.parameter;
  }
  if (e && e.postData && e.postData.contents) {
    return JSON.parse(e.postData.contents);
  }
  throw new Error("Nenhum dado recebido no pedido (nem parameter, nem postData).");
}

/**
 * Grava o erro em uma aba "Logs" da planilha, para diagnóstico.
 * Isso existe só para facilitar a depuração — pode remover depois
 * que tudo estiver funcionando.
 */
function registrarErro(erro, e) {
  try {
    const planilha = SpreadsheetApp.openById(SPREADSHEET_ID);
    let aba = planilha.getSheetByName("Logs");
    if (!aba) {
      aba = planilha.insertSheet("Logs");
      aba.appendRow(["Data/Hora", "Erro", "Dados recebidos"]);
    }
    aba.appendRow([
      new Date(),
      "[" + VERSAO_DEBUG + "] " + String(erro) + " | stack: " + (erro && erro.stack ? erro.stack : ""),
      JSON.stringify({
        parameter: e ? e.parameter : null,
        postData: e && e.postData ? e.postData.contents : null,
      }),
    ]);
  } catch (erroDoLog) {
    // Se nem isso funcionar, não tem muito mais o que fazer aqui.
  }
}

/**
 * Salva os dados recebidos em uma nova linha da planilha.
 */
function salvarNaPlanilha(dados) {
  const planilha = SpreadsheetApp.openById(SPREADSHEET_ID);
  let aba = planilha.getSheetByName(SHEET_NAME);

  if (!aba) {
    aba = planilha.insertSheet(SHEET_NAME);
    aba.appendRow([
      "Data/Hora",
      "Nome",
      "E-mail",
      "Telefone",
      "Curso",
      "Período",
      "CPF",
      "Protocolo",
      "Status Pagamento",
    ]);
  }

  // Se o formulário já enviou um protocolo (gerado no navegador),
  // reaproveita; senão gera um novo aqui no servidor.
  const protocolo = dados.protocolo || gerarProtocolo();

  aba.appendRow([
    new Date(),
    dados.nome || "",
    dados.email || "",
    dados.telefone || "",
    dados.curso || "",
    dados.periodo || "",
    dados.cpf || "",
    protocolo,
    "Aguardando pagamento",
  ]);

  // Guarda o protocolo no próprio objeto para reaproveitar no e-mail.
  dados.protocolo = protocolo;
}

/**
 * Atualiza a linha correspondente ao protocolo informado, marcando
 * que o aluno CLICOU no botão "Já realizei o pagamento" no site.
 *
 * IMPORTANTE: isto é uma autodeclaração do aluno, não uma
 * verificação automática de que o Pix realmente caiu. A organização
 * deve conferir o extrato bancário e cruzar com esta coluna antes
 * de liberar certificado/lista de presença.
 */
function confirmarPagamentoNaPlanilha(protocolo) {
  if (!protocolo) throw new Error("Protocolo não informado para confirmação de pagamento.");

  const planilha = SpreadsheetApp.openById(SPREADSHEET_ID);
  const aba = planilha.getSheetByName(SHEET_NAME);
  if (!aba) throw new Error("Aba de inscrições não encontrada.");

  const valores = aba.getDataRange().getValues();
  const cabecalho = valores[0];
  const colProtocolo = cabecalho.indexOf("Protocolo");
  const colStatus = cabecalho.indexOf("Status Pagamento");

  if (colProtocolo === -1 || colStatus === -1) {
    throw new Error("Colunas de Protocolo/Status Pagamento não encontradas.");
  }

  for (let i = 1; i < valores.length; i++) {
    if (valores[i][colProtocolo] === protocolo) {
      const agora = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy HH:mm");
      aba.getRange(i + 1, colStatus + 1).setValue(
        `Pago (autodeclarado pelo aluno) — ${agora}`
      );
      return;
    }
  }

  throw new Error("Protocolo não encontrado na planilha: " + protocolo);
}

/**
 * Envia o e-mail de confirmação para o inscrito, usando o Gmail
 * da conta que executa o script.
 */
function enviarEmailConfirmacao(dados) {
  if (!dados.email) return;

  const assunto = `Inscrição confirmada — ${EVENTO.nome}`;

  const corpo = `
Olá, ${dados.nome}!

Sua inscrição na ${EVENTO.nome} foi recebida com sucesso.

Resumo da inscrição:
- Evento: ${EVENTO.nome} — ${EVENTO.tema}
- Datas: ${EVENTO.datas}
- Local: ${EVENTO.local}
- Valor: ${EVENTO.valor}
- Protocolo: ${dados.protocolo || "-"}

Guarde este e-mail como comprovante da sua inscrição.

Nos vemos lá!
Equipe organizadora — ${EVENTO.nome}
  `.trim();

  GmailApp.sendEmail(dados.email, assunto, corpo);
}

function gerarProtocolo() {
  const agora = new Date();
  const timestamp = Utilities.formatDate(agora, "GMT-3", "yyMMddHHmmss");
  return `SP2026-${timestamp}`;
}

function respostaJson(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/**
 * FUNÇÃO DE TESTE — não é usada pelo site.
 * Rode esta função direto no editor (selecione "testarDoPost" no menu
 * ao lado do botão "Executar" e clique em Executar) para simular um
 * envio do formulário e ver o erro completo aqui no editor, com stack
 * trace, em vez de só "Failed" no log de execuções.
 */
function testarDoPost() {
  const eFalso = {
    postData: {
      contents: JSON.stringify({
        acao: "inscricao",
        nome: "Teste da Silva",
        email: "teste@example.com",
        telefone: "11999999999",
        curso: "Psicologia",
        periodo: "4º período",
        cpf: "12345678909",
      }),
    },
  };

  const resultado = doPost(eFalso);
  Logger.log(resultado.getContent());
}
