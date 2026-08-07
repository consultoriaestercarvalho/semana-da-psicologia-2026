# Site de Inscrição — V Semana da Psicologia 2026

Site estático (HTML + CSS + JS puro) para inscrição no evento, com envio
automático dos dados para o Google Sheets, e-mail de confirmação via Gmail
(Google Apps Script) e redirecionamento para pagamento na Infinity Pay.

## Estrutura de arquivos

```
site/
├── index.html            → Página inicial
├── inscricao.html        → Formulário de inscrição
├── confirmacao.html      → Página de agradecimento/confirmação
├── css/
│   └── style.css         → Estilos (identidade visual do evento)
├── js/
│   ├── config.js         → ⚠️ ÚNICO arquivo que você precisa editar
│   ├── main.js           → Menu mobile + abas de programação
│   └── form.js           → Validação e envio do formulário
├── assets/                → Logo e ilustrações do kit de identidade visual
└── apps-script/
    └── Code.gs            → Código para colar no Google Apps Script
```

## Passo a passo de configuração

### 1. Google Sheets + confirmação por e-mail

1. Crie uma planilha nova no Google Sheets (ex: "Inscrições — Semana da Psicologia 2026").
2. No menu, vá em **Extensões > Apps Script**.
3. Apague o conteúdo padrão e cole o conteúdo do arquivo `apps-script/Code.gs`.
4. Clique em **Implantar > Nova implantação**:
   - Tipo: **App da Web**
   - Executar como: **Eu** (sua conta)
   - Quem pode acessar: **Qualquer pessoa**
5. Autorize as permissões pedidas (acesso à planilha e ao Gmail).
6. Copie a URL gerada (termina em `/exec`).
7. Cole essa URL em `js/config.js`, no campo:
   ```js
   googleSheets: {
     scriptUrl: "COLE_AQUI_A_URL",
   },
   ```

A cada nova inscrição, uma linha é criada na aba "Inscricoes" da planilha e
um e-mail de confirmação é enviado automaticamente pelo Gmail da conta que
fez a implantação.

### 2. Infinity Pay

1. No painel da Infinity Pay, gere o link de checkout para a cobrança de
   R$ 30,00 (pré-venda).
2. Cole o link em `js/config.js`:
   ```js
   infinityPay: {
     checkoutUrl: "COLE_AQUI_O_LINK_DA_INFINITY_PAY",
   },
   ```

**Enquanto esse campo estiver vazio**, o site pula direto para a página de
confirmação após o cadastro (modo de teste), sem travar o fluxo.

### 3. Alterar o valor da inscrição no futuro

Basta editar dois campos em `js/config.js`:

```js
inscricao: {
  valor: 30.0,
  valorFormatado: "R$ 30,00",
  faseAtual: "Pré-venda",
},
```

O valor exibido no site inteiro (hero, CTA, formulário, FAQ e confirmação)
é atualizado automaticamente a partir desse arquivo.

## Publicar no GitHub Pages

1. Crie um repositório novo no GitHub (ex: `semana-psicologia-2026`).
2. Envie todos os arquivos desta pasta (`site/`) para a raiz do repositório.
3. Vá em **Settings > Pages**.
4. Em "Source", selecione a branch `main` e a pasta `/ (root)`.
5. Salve. Em alguns minutos o site estará no ar em:
   `https://SEU-USUARIO.github.io/semana-psicologia-2026/`

## Observações

- O formulário já tem proteção anti-spam básica (honeypot) e validação de
  CPF, e-mail e telefone no navegador.
- O site é 100% responsivo (mobile-first) e usa foco visível para
  navegação por teclado.
- A tipografia (Playfair Display + Inter) e a paleta de cores seguem
  exatamente o Kit de Identidade Visual fornecido.
