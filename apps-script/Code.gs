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

// Cole aqui o ID da sua planilha (está na URL dela, entre /d/ e /edit).
const SPREADSHEET_ID = "COLE_AQUI_O_ID_DA_PLANILHA";

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
    const dados = JSON.parse(e.postData.contents);

    salvarNaPlanilha(dados);
    enviarEmailConfirmacao(dados);

    return respostaJson({ ok: true });
  } catch (erro) {
    return respostaJson({ ok: false, erro: String(erro) });
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
    ]);
  }

  const protocolo = gerarProtocolo();

  aba.appendRow([
    new Date(),
    dados.nome || "",
    dados.email || "",
    dados.telefone || "",
    dados.curso || "",
    dados.periodo || "",
    dados.cpf || "",
    protocolo,
  ]);

  // Guarda o protocolo no próprio objeto para reaproveitar no e-mail.
  dados.protocolo = protocolo;
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
