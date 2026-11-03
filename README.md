# Central de Marketing — ORDNAS & VEKTRA Contabilidade

Painel de gestão de marketing para as duas marcas: calendário de posts, roteiros com teleprompter, legendas, prompts de IA, funis de vendas em mapa mental (com simulador), Instagram conectado, tráfego pago, orçamento, CRM de leads, métricas e relatórios, metas, concorrentes e rotina do analista.

## Como usar
- Abra `index.html` no navegador, ou rode um servidor local (ex.: `npx serve .`) e acesse `http://localhost:3000`.
- Os dados ficam no **banco de dados** do sistema (veja abaixo). Use **Banco de dados** no menu para ver o status, as cópias e o backup.
- Tokens da Meta e chave da API da IA ficam só no navegador — nunca são enviados para este repositório.

## Estrutura
- `index.html` — página principal
- `assets/css/style.css` — visual
- `assets/js/core.js` — estado, banco local, navegação e componentes
- `assets/js/data.js` — base de conhecimento (funis, ganchos, datas fiscais, prompts, benchmarks)
- `assets/js/views/` — uma tela por arquivo

## Site publicado
Acesse: **https://dimitrifergus.github.io/central-marketing-ordnas-vektra/**

O site é publicado automaticamente pelo GitHub Actions (`.github/workflows/pages.yml`) a cada atualização na branch `main`. Cada pessoa que abre o site usa os próprios dados, salvos no navegador dela.

## Banco de dados
- **Local (IndexedDB):** cada alteração é gravada na hora, com cópia espelho e pedido de armazenamento persistente ao navegador.
- **Cópias automáticas:** ao abrir o sistema e a cada 30 minutos (20 versões), além de uma cópia antes de qualquer restauração/importação.
- **Nuvem (opcional, Supabase/PostgreSQL):** login por e-mail, sincronização automática entre computadores, funciona offline e envia quando a conexão volta. Cada usuário só acessa os próprios dados (Row Level Security). Script da tabela: `supabase/schema.sql`.
- Tokens do Instagram e a chave da IA nunca vão para a nuvem nem para o backup (opcional).
