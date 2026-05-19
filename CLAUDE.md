# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Vistoria Fácil** — web app responsivo para laudos de vistoria imobiliária com IA.  
Público-alvo: vistoriadores autônomos e imobiliárias.  
Modelo de negócio: pagamento por laudo (R$ 29,99), via Mercado Pago.

## Stack

- **Frontend**: React + Vite + Tailwind CSS v4
- **Backend/Auth/DB**: Supabase (PostgreSQL + Auth + Storage)
- **IA**: Claude API (Vision) — chamada via Supabase Edge Function, nunca direto do frontend
- **PDF**: jsPDF + html2canvas
- **Estado global**: Zustand (`src/store/vistoriaStore.js`)
- **Roteamento**: React Router v7
- **Ícones**: Lucide React

## Comandos

```bash
npm run dev      # servidor de desenvolvimento (http://localhost:5173)
npm run build    # build de produção
npm run preview  # preview do build
```

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:
- `VITE_SUPABASE_URL` — URL do projeto Supabase
- `VITE_SUPABASE_ANON_KEY` — chave pública do Supabase
- `VITE_ANTHROPIC_API_KEY` — usada apenas na Edge Function (não expor no frontend)

## Arquitetura

```
src/
├── pages/          # uma página por rota
├── components/     # componentes reutilizáveis
├── lib/
│   ├── supabase.js # cliente Supabase (singleton)
│   └── claude.js   # chama /api/descrever-foto (Edge Function)
└── store/
    └── vistoriaStore.js  # estado completo da vistoria em andamento (Zustand)
```

### Fluxo principal

1. Login/Cadastro → Dashboard
2. Nova Vistoria (wizard): Dados do imóvel → Proprietários/Inquilinos → Cômodos + Fotos → Medidores → Revisão
3. Cada foto é enviada à Claude Vision via Edge Function → descrição retorna para o usuário revisar/editar
4. Ao finalizar: geração do PDF → pagamento Mercado Pago → laudo disponível para download/envio

### Banco de dados (Supabase)

Tabelas principais:
- `vistorias` — (id, user_id, tipo: entrada|saida, status: rascunho|pendente_pagamento|concluido)
- `imoveis` — (vistoria_id, endereço completo)
- `pessoas` — (vistoria_id, papel: proprietario|inquilino, nome, cpf, rg)
- `comodos` — (vistoria_id, nome, ordem)
- `fotos` — (comodo_id, url, descricao_ia, descricao_editada)
- `medidores` — (vistoria_id, agua, luz, gas, chaves)
- `pagamentos` — (vistoria_id, status, mp_payment_id, valor)

### Regra importante: a chave da Claude API nunca vai para o frontend

A chamada à API da Anthropic é feita exclusivamente via Supabase Edge Function (`/api/descrever-foto`), que recebe a imagem em base64 e retorna a descrição. O frontend usa `src/lib/claude.js` que chama esse endpoint.

## Idioma

Todo o código, variáveis e comentários em **português brasileiro**.
