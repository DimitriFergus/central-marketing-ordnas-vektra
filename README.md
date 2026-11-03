# Central de Marketing — ORDNAS & VEKTRA Contabilidade

Painel de gestão de marketing para as duas marcas: calendário de posts, roteiros com teleprompter, legendas, prompts de IA, funis de vendas em mapa mental (com simulador), Instagram conectado, tráfego pago, orçamento, CRM de leads, métricas e relatórios, metas, concorrentes e rotina do analista.

## Como usar
- Abra `index.html` no navegador, ou rode um servidor local (ex.: `npx serve .`) e acesse `http://localhost:3000`.
- Os dados ficam salvos no navegador (localStorage). Use **Backup dos dados** para exportar/importar.
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
