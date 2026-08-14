/* ============================================================
   CONFIGURAÇÃO GERAL DO SITE — V Semana da Psicologia 2026
   ============================================================
   Preencha os valores abaixo conforme as integrações forem
   sendo liberadas. Nada mais no código precisa ser alterado
   além deste arquivo.
   ============================================================ */

const CONFIG = {
  evento: {
    nome: "V° Semana da Psicologia",
    tema: "A Psicologia e a Revolução Tecnológica",
    ano: 2026,
    datas: "26, 27 e 28 de agosto de 2026",
    local: "Faculdade Nassau (UNINASSAU)",
  },

  inscricao: {
    // Valor da pré-venda. Altere aqui quando sair da pré-venda.
    valor: 30.0,
    valorFormatado: "R$ 30,00",
    faseAtual: "Pré-venda", // ex: "Pré-venda" | "Lote 2" | "Últimas vagas"
  },

  // ------------------------------------------------------------
  // 1) CHAVE PIX
  // ------------------------------------------------------------
  // Chave Pix (telefone) para pagamento manual pelo app do banco.
  // Como não é mais um código copia-e-cola com valor embutido, o
  // valor precisa ser digitado pelo aluno na hora de pagar.
  pix: {
    chave: "87981745632",
    tipoChave: "Telefone",
    nomeRecebedor: "Ester Rodrigues Diniz Carvalho",
    cidade: "Serra Talhada",
  },

  // ------------------------------------------------------------
  // 2) GOOGLE SHEETS (via Google Apps Script)
  // ------------------------------------------------------------
  // 1. Abra sua planilha no Google Sheets.
  // 2. Extensões > Apps Script.
  // 3. Cole o conteúdo do arquivo apps-script/Code.gs (está na pasta do projeto).
  // 4. Implantar > Nova implantação > Tipo "App da Web".
  //    - Executar como: Eu
  //    - Quem pode acessar: Qualquer pessoa
  // 5. Copie a URL gerada (termina em /exec) e cole abaixo.
  googleSheets: {
    scriptUrl: "https://script.google.com/macros/s/AKfycbyYSI2_3gIENkIK9uPJoj-jWPwx_BdMW2TCdwMTy0lzYzqCaXrjow7MX6iUZgjx1JfUbw/exec",
  },

  // ------------------------------------------------------------
  // 3) E-MAIL DE CONFIRMAÇÃO
  // ------------------------------------------------------------
  // O envio do e-mail é feito pelo MESMO Google Apps Script acima
  // (função enviarEmailConfirmacao no Code.gs), usando o Gmail
  // da conta que fez a implantação. Não precisa de credenciais
  // extras aqui — apenas edite o texto do e-mail dentro do Code.gs.
  email: {
    remetenteNome: "V Semana da Psicologia",
    assunto: "Inscrição confirmada — V Semana da Psicologia 2026",
  },
};
