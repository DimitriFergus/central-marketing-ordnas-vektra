/* ===== Funis de vendas: biblioteca, criador, mapa mental e simulador ===== */
const NODE_W = 190;

function funnelFromTemplate(t, brand, name) {
  return {
    brand, name: name || t.name, templateId: t.id,
    nodes: t.nodes.map(n => ({ id: n.id, t: n.t, n: n.n, d: n.d || '', x: 40 + n.c * 240, y: 40 + n.r * 150, rate: n.rate ?? '' })),
    edges: t.edges.map(e => [...e]),
    sim: { mode: t.sim.mode, cost: t.sim.cost, base: t.sim.base || 0, invest: t.sim.mode === 'reach' || t.sim.mode === 'base' ? 0 : 1500, ticket: 450, months: 24, firstRate: t.sim.firstRate || '' , label: t.sim.label },
  };
}

function simulate(f) {
  const s = f.sim || {};
  const stages = f.nodes.filter(n => n.rate !== '' && n.rate !== undefined && n.rate !== null).sort((a, b) => a.x - b.x || a.y - b.y);
  let entry, entryLabel;
  if (s.mode === 'cpl') { entry = num(s.cost) ? num(s.invest) / num(s.cost) : 0; entryLabel = 'Leads/contatos gerados'; }
  else if (s.mode === 'cpc') { entry = num(s.cost) ? num(s.invest) / num(s.cost) : 0; entryLabel = 'Cliques'; }
  else { entry = num(s.base); entryLabel = s.mode === 'base' ? 'Clientes na carteira' : 'Pessoas alcançadas'; }
  const rows = [{ name: entryLabel, value: entry }];
  let cur = entry;
  if (s.mode === 'cpc' && num(s.firstRate)) { cur = cur * num(s.firstRate) / 100; rows.push({ name: 'Iniciaram a jornada', value: cur, rate: num(s.firstRate) }); }
  stages.forEach(n => { cur = cur * num(n.rate) / 100; rows.push({ name: n.n, value: cur, rate: num(n.rate), id: n.id }); });
  const clients = cur;
  const ltv = num(s.ticket) * num(s.months);
  const invest = num(s.invest);
  return { rows, clients, ltv, revenue: clients * ltv, mrr: clients * num(s.ticket), cac: clients ? invest / clients : 0, roi: invest ? (clients * ltv - invest) / invest * 100 : 0, invest };
}

view('funnels', {
  title: 'Funis de vendas', icon: 'git-fork', sub: 'Mapas mentais, modelos de mercado e simulador',
  render(el) {
    if (state.ui.funnelId && DB.get('funnels', state.ui.funnelId)) return renderFunnelEditor(el, DB.get('funnels', state.ui.funnelId));
    state.ui.funnelId = null;
    const mine = DB.all('funnels');
    const tb = tabs('fnTab', [['lib', 'Biblioteca de funis do mercado'], ['create', 'Criar funil personalizado'], ['mine', `Meus funis (${mine.length})`]]);
    el.innerHTML = tb.html + '<div id="fnBody"></div>';
    const body = $('#fnBody', el);
    if (tb.cur === 'lib') {
      body.innerHTML = `<div class="tip mb">Os ${FUNNEL_TEMPLATES.length} funis mais usados no mercado (Russell Brunson, Jeff Walker, inbound marketing, Click-to-WhatsApp etc.), já adaptados para escritórios de contabilidade. Clique para ver o passo a passo ou para usar e personalizar no mapa mental.</div>
        <div class="grid g3">${FUNNEL_TEMPLATES.map(t => `<div class="card tpl-card" data-tpl="${t.id}"><div class="row"><span class="badge ${t.nivel === 'Iniciante' ? 'ok' : t.nivel === 'Avançado' ? 'bad' : 'warn'}">${t.nivel}</span><span class="badge">${t.nodes.length} etapas</span></div>
          <h3 class="mt-s" style="margin-bottom:6px">${esc(t.name)}</h3><div class="muted small">${esc(t.origem)}</div><p class="small" style="margin:10px 0 0">${esc(t.ideal)}</p>
          <div class="row"><button class="btn xs" data-det="${t.id}">${ico('eye')}Ver detalhes</button><button class="btn xs primary" data-use="${t.id}">${ico('copy-plus')}Usar este funil</button></div></div>`).join('')}</div>`;
      $$('[data-det]', body).forEach(b => b.onclick = e => { e.stopPropagation(); funnelDetails(FUNNEL_TEMPLATES.find(t => t.id === b.dataset.det)); });
      $$('[data-use]', body).forEach(b => b.onclick = e => { e.stopPropagation(); useTemplate(b.dataset.use); });
      $$('[data-tpl]', body).forEach(c => c.onclick = () => funnelDetails(FUNNEL_TEMPLATES.find(t => t.id === c.dataset.tpl)));
    } else if (tb.cur === 'mine') {
      body.innerHTML = `<div class="row mb"><span class="sp"></span><button class="btn" id="fnBlank">${ico('plus')}Funil em branco</button></div>` + (mine.length ? `<div class="grid g3">${mine.map(f => { const r = simulate(f); return `<div class="card"><div class="row">${state.brand === 'all' ? brandBadge(f.brand) : ''}<span class="badge">${f.nodes.length} etapas</span></div><h3 class="mt-s" style="margin-bottom:4px">${esc(f.name)}</h3>
        <div class="muted small">Projeção: ${fmt.num(r.clients, 1)} clientes/mês · CAC ${r.cac ? fmt.money(r.cac) : '—'}</div>
        <div class="row mt"><button class="btn xs primary" data-edit="${f.id}">${ico('pencil')}Abrir mapa</button><button class="btn xs" data-dup="${f.id}">${ico('copy')}Duplicar</button><button class="btn xs danger" data-rm="${f.id}">${ico('trash-2')}</button></div></div>`; }).join('')}</div>` : `<div class="card">${emptyState('Você ainda não tem funis. Use um modelo da biblioteca ou crie um personalizado.', 'git-fork')}</div>`);
      $('#fnBlank', body).onclick = () => { const f = DB.add('funnels', { brand: genBrand(), name: 'Novo funil', nodes: [{ id: uid(), t: 'trafego', n: 'Entrada de tráfego', d: '', x: 60, y: 160, rate: '' }], edges: [], sim: { mode: 'cpl', cost: 15, invest: 1000, ticket: 450, months: 24, base: 0 } }); state.ui.funnelId = f.id; App.render(); };
      $$('[data-edit]', body).forEach(b => b.onclick = () => { state.ui.funnelId = b.dataset.edit; App.render(); });
      $$('[data-dup]', body).forEach(b => b.onclick = () => { const f = JSON.parse(JSON.stringify(DB.get('funnels', b.dataset.dup))); delete f.id; f.name += ' (cópia)'; DB.add('funnels', f); App.render(); });
      $$('[data-rm]', body).forEach(b => b.onclick = () => { if (confirm('Excluir este funil?')) { DB.remove('funnels', b.dataset.rm); App.render(); } });
    } else renderFunnelWizard(body);
  },
});

function useTemplate(id, custom) {
  const t = FUNNEL_TEMPLATES.find(x => x.id === id);
  const f = DB.add('funnels', { ...funnelFromTemplate(t, genBrand(), custom?.name), ...(custom?.patch || {}) });
  if (custom?.apply) { custom.apply(f); save(); }
  state.ui.funnelId = f.id; toast('Funil criado — personalize no mapa'); App.render();
}

function funnelDetails(t) {
  const f = funnelFromTemplate(t, genBrand());
  const r = simulate(f);
  modal({
    title: t.name, size: 'wide', saveLabel: 'Usar este funil',
    body: `<p class="muted small">${esc(t.origem)} · Nível ${t.nivel}</p><p>${esc(t.desc)}</p><div class="tip mb"><strong>Ideal para:</strong> ${esc(t.ideal)}</div>
      <div class="grid g2"><div><h4 class="mb">Etapas</h4><div class="steps">${[...f.nodes].sort((a, b) => a.x - b.x || a.y - b.y).map(n => `<div class="step"><strong>${esc(n.n)}</strong> <span class="badge" style="color:${NODE_TYPES[n.t].c}">${NODE_TYPES[n.t].n}</span>${n.rate !== '' ? ` <span class="badge">${n.rate}%</span>` : ''}<div class="muted small">${esc(n.d)}</div></div>`).join('')}</div></div>
      <div><h4 class="mb">KPIs para acompanhar</h4><ul class="small">${t.kpis.map(k => `<li>${esc(k)}</li>`).join('')}</ul>
      <h4 class="mb mt">Projeção com valores padrão</h4><div class="small">${f.sim.invest ? `Investimento de ${fmt.money(f.sim.invest)}/mês · ${esc(t.sim.label)}: ${fmt.money(t.sim.cost)}` : `${esc(t.sim.label)}: ${fmt.num(f.sim.base)}`}<br><strong>≈ ${fmt.num(r.clients, 1)} novos clientes/mês</strong>${r.cac ? ` · CAC ${fmt.money(r.cac)}` : ''}</div>
      <p class="muted small">Ajuste todas as taxas no simulador depois de criar.</p></div></div>`,
    onSave: () => useTemplate(t.id),
  });
}

/* Criador personalizado: recomenda e monta o funil */
function renderFunnelWizard(body) {
  body.innerHTML = `<div class="grid g-side-l"><div class="card" style="align-self:start"><h3>${ico('compass')}Responda e eu monto o funil ideal</h3><form id="wzForm">
    ${genBrandPicker()}
    ${F.select('obj', 'O que você quer vender?', [['abertura', 'Abertura de empresa'], ['troca', 'Troca de contador (empresas que já têm)'], ['mensal', 'Contabilidade mensal (geral)'], ['planejamento', 'Planejamento tributário / holding (alto valor)'], ['irpf', 'Declaração de IRPF (sazonal)'], ['bpo', 'BPO financeiro'], ['mei', 'Serviços para MEI']])}
    ${F.num('budget', 'Orçamento mensal de anúncios (R$)', 1500)}
    ${F.num('ticket', 'Honorário mensal médio (R$)', 450)}
    ${F.select('speed', 'Quando precisa de resultado?', [['rapido', 'Rápido (este mês)'], ['medio', 'Em 1-3 meses'], ['longo', 'Construção de longo prazo']])}
    ${F.select('channel', 'Canal principal', [['whats', 'WhatsApp'], ['insta', 'Instagram orgânico'], ['google', 'Google'], ['mix', 'Combinação']])}
    ${F.check('team', 'Tenho alguém para atender os leads rápido (até 15 min)', true)}
    ${F.check('site', 'Tenho site / landing page', false)}
    <button class="btn primary mt" style="width:100%;justify-content:center">${ico('sparkles')}Recomendar funis</button></form></div><div id="wzOut">${emptyState('As recomendações aparecem aqui, com o motivo de cada escolha.', 'compass')}</div></div>`;
  $('#wzForm', body).onsubmit = e => {
    e.preventDefault();
    const d = formData(e.target), sc = {};
    FUNNEL_TEMPLATES.forEach(t => sc[t.id] = { s: 0, why: [] });
    const add = (id, n, why) => { sc[id].s += n; if (why) sc[id].why.push(why); };
    if (d.speed === 'rapido') { add('ctwa', 4, 'gera conversas no mesmo dia'); add('google', 3, 'capta quem já procura contador'); add('remarketing', 2); }
    if (d.speed === 'longo') { add('organic', 4, 'constrói audiência própria'); add('leadmagnet', 3, 'forma uma lista de contatos'); add('referral', 3, 'aumenta o LTV da carteira'); }
    if (d.speed === 'medio') { add('leadmagnet', 2); add('quiz', 2, 'engaja e segmenta'); add('switch', 2); }
    if (d.obj === 'abertura') { add('ctwa', 3, 'quem vai abrir empresa quer conversar logo'); add('google', 3, 'alta busca por “abrir empresa”'); add('quiz', 1); }
    if (d.obj === 'troca') { add('switch', 5, 'feito para quem está insatisfeito com o contador atual'); add('remarketing', 1); }
    if (d.obj === 'planejamento') { add('application', 5, 'filtra empresas maiores e de alto valor'); add('webinar', 3, 'educa antes de vender um serviço complexo'); }
    if (d.obj === 'irpf') { add('launch', 5, 'aproveita o pico sazonal com urgência real'); add('ctwa', 2); }
    if (d.obj === 'bpo') { add('tripwire', 3, 'consultoria de entrada mostra valor'); add('referral', 3, 'venda para a base atual'); add('application', 2); }
    if (d.obj === 'mei') { add('quiz', 3, 'MEIs respondem muito bem a testes'); add('leadmagnet', 3, 'kit MEI como isca'); add('organic', 2); }
    if (d.obj === 'mensal') { add('ctwa', 2); add('organic', 2); add('switch', 2); }
    if (num(d.budget) < 600) { add('organic', 3, 'funciona com pouco orçamento'); add('referral', 3, 'custo de aquisição quase zero'); add('ctwa', 1); add('webinar', -3); add('launch', -2); }
    if (num(d.budget) >= 3000) { add('webinar', 2); add('remarketing', 2, 'com volume, o remarketing fica eficiente'); }
    if (num(d.ticket) >= 1200) { add('application', 3, 'ticket alto justifica reunião estratégica'); }
    if (d.channel === 'whats') add('ctwa', 3); if (d.channel === 'insta') add('organic', 3); if (d.channel === 'google') add('google', 4);
    if (!d.site) { add('google', -2); add('leadmagnet', -1); add('webinar', -1); add('ctwa', 1, 'não precisa de site'); }
    if (!d.team) { add('ctwa', -3); add('leadmagnet', 2, 'automação trabalha por você enquanto não há equipe'); }
    const top = Object.entries(sc).sort((a, b) => b[1].s - a[1].s).slice(0, 3);
    const svc = { abertura: 'abertura de empresa', troca: 'troca de contador', mensal: 'contabilidade mensal', planejamento: 'planejamento tributário', irpf: 'declaração de IRPF', bpo: 'BPO financeiro', mei: 'serviços para MEI' }[d.obj];
    $('#wzOut', body).innerHTML = top.map(([id, v], i) => { const t = FUNNEL_TEMPLATES.find(x => x.id === id); const f = funnelFromTemplate(t, genBrand()); f.sim.invest = num(d.budget) || f.sim.invest; f.sim.ticket = num(d.ticket); const r = simulate(f);
      return `<div class="card ${i ? 'mt' : ''}" style="${i === 0 ? 'border-color:var(--brand)' : ''}"><div class="row">${i === 0 ? '<span class="badge ok">Melhor opção</span>' : `<span class="badge">Opção ${i + 1}</span>`}<h3 style="margin:0">${esc(t.name)}</h3></div>
        <p class="small">${esc(t.desc)}</p><p class="small"><strong>Por que:</strong> ${[...new Set(v.why)].join('; ') || 'combina com o seu perfil'}.</p>
        <p class="small muted">Projeção inicial: ≈ ${fmt.num(r.clients, 1)} clientes/mês${r.cac ? ` · CAC ${fmt.money(r.cac)}` : ''}</p>
        <button class="btn sm primary" data-mk="${id}">${ico('git-fork')}Montar este funil para ${esc(svc)}</button></div>`; }).join('');
    $$('[data-mk]', body).forEach(b => b.onclick = () => useTemplate(b.dataset.mk, {
      name: `${FUNNEL_TEMPLATES.find(x => x.id === b.dataset.mk).name.split('(')[0].trim()} — ${svc}`,
      apply: f => { f.sim.invest = num(d.budget) || f.sim.invest; f.sim.ticket = num(d.ticket) || f.sim.ticket; f.nodes.forEach(n => { if (['oferta', 'trafego'].includes(n.t)) n.d = (n.d ? n.d + ' ' : '') + `Foco: ${svc}.`; }); },
    }));
    icons();
  };
}

/* ---------- Editor de mapa mental ---------- */
function renderFunnelEditor(el, f) {
  const ui = state.ui.fnView ||= {};
  const vw = ui[f.id] ||= { x: 0, y: 0, z: 0.9 };
  let selected = null, connectFrom = null, connectMode = false;

  el.innerHTML = `<div class="row mb"><button class="btn" id="fnBack">${ico('arrow-left')}Voltar</button><input id="fnName" value="${esc(f.name)}" style="max-width:380px;font-weight:700">${state.brand === 'all' ? brandBadge(f.brand) : ''}<span class="sp"></span>
      <button class="btn" id="fnPrint">${ico('printer')}Imprimir / PDF</button></div>
    <div class="grid g-side"><div><div class="fn-wrap" id="fnWrap">
      <div class="fn-toolbar"><select id="fnType" style="width:auto">${Object.entries(NODE_TYPES).map(([k, v]) => `<option value="${k}">${v.n}</option>`).join('')}</select>
        <button class="btn sm primary" id="fnAdd">${ico('plus')}Etapa</button><button class="btn sm" id="fnConnect">${ico('spline')}Conectar</button><button class="btn sm" id="fnLayout">${ico('layout-grid')}Organizar</button></div>
      <div class="fn-zoom"><button class="icon-btn" id="zOut">${ico('minus')}</button><button class="icon-btn" id="zFit">${ico('maximize')}</button><button class="icon-btn" id="zIn">${ico('plus')}</button></div>
      <div class="fn-hint" id="fnHint">Arraste etapas · arraste o fundo para mover · roda do mouse = zoom · clique numa linha para removê-la</div>
      <div class="fn-stage" id="fnStage"><svg class="fn-svg" id="fnSvg" width="4000" height="3000"><defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#94a3b8"/></marker></defs><g id="fnEdges"></g></svg><div id="fnNodes"></div></div>
    </div><div class="legend mt-s">${Object.values(NODE_TYPES).map(v => `<span><i class="dot" style="background:${v.c}"></i>${v.n}</span>`).join('')}</div></div>
    <div class="grid" style="align-content:start"><div class="card" id="fnPanel"></div><div class="card" id="fnSim"></div></div></div>`;

  const wrap = $('#fnWrap', el), stage = $('#fnStage', el), nodesEl = $('#fnNodes', el), edgesEl = $('#fnEdges', el);
  const persist = () => { DB.update('funnels', f.id, { nodes: f.nodes, edges: f.edges, sim: f.sim, name: f.name, notes: f.notes }); };
  const applyView = () => { stage.style.transform = `translate(${vw.x}px,${vw.y}px) scale(${vw.z})`; save(); };

  function drawEdges() {
    edgesEl.innerHTML = f.edges.map(([a, b], i) => {
      const A = f.nodes.find(n => n.id === a), B = f.nodes.find(n => n.id === b); if (!A || !B) return '';
      const ha = $(`[data-n="${a}"]`, nodesEl)?.offsetHeight || 80, hb = $(`[data-n="${b}"]`, nodesEl)?.offsetHeight || 80;
      let x1 = A.x + NODE_W, y1 = A.y + ha / 2, x2 = B.x, y2 = B.y + hb / 2;
      if (B.x + NODE_W < A.x) { x1 = A.x; x2 = B.x + NODE_W; }
      else if (Math.abs(B.x - A.x) < NODE_W) { x1 = A.x + NODE_W / 2; y1 = B.y > A.y ? A.y + ha : A.y; x2 = B.x + NODE_W / 2; y2 = B.y > A.y ? B.y : B.y + hb; const dy = (y2 - y1) / 2; return `<path d="M${x1},${y1} C${x1},${y1 + dy} ${x2},${y2 - dy} ${x2},${y2}" stroke="#94a3b8" stroke-width="2" fill="none" marker-end="url(#arr)"/><path d="M${x1},${y1} C${x1},${y1 + dy} ${x2},${y2 - dy} ${x2},${y2}" stroke="transparent" stroke-width="14" fill="none" style="pointer-events:stroke;cursor:pointer" data-e="${i}"/>`; }
      const dx = Math.max(40, Math.abs(x2 - x1) / 2) * (x2 >= x1 ? 1 : -1);
      const d = `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
      return `<path d="${d}" stroke="#94a3b8" stroke-width="2" fill="none" marker-end="url(#arr)"/><path d="${d}" stroke="transparent" stroke-width="14" fill="none" style="pointer-events:stroke;cursor:pointer" data-e="${i}"/>`;
    }).join('');
    $$('[data-e]', edgesEl).forEach(p => p.addEventListener('pointerdown', e => { e.stopPropagation(); if (confirm('Remover esta conexão?')) { f.edges.splice(+p.dataset.e, 1); persist(); drawEdges(); } }));
  }
  function drawNodes() {
    nodesEl.innerHTML = f.nodes.map(n => `<div class="fn-node ${selected === n.id ? 'sel' : ''} ${connectFrom === n.id ? 'connect-src' : ''}" data-n="${n.id}" style="left:${n.x}px;top:${n.y}px;--c:${NODE_TYPES[n.t]?.c || '#64748b'}">
      <div class="ty">${NODE_TYPES[n.t]?.n || n.t}</div><div class="nm">${esc(n.n)}</div>${n.d ? `<div class="nt">${esc(n.d)}</div>` : ''}${n.rate !== '' && n.rate !== undefined ? `<div class="rt">↳ conversão ${n.rate}%</div>` : ''}</div>`).join('');
    $$('.fn-node', nodesEl).forEach(nd => nd.addEventListener('pointerdown', nodeDown));
    drawEdges();
  }
  function nodeDown(e) {
    e.stopPropagation();
    const id = e.currentTarget.dataset.n, n = f.nodes.find(x => x.id === id), el2 = e.currentTarget;
    if (connectMode) {
      if (!connectFrom) { connectFrom = id; drawNodes(); $('#fnHint').textContent = 'Agora clique na etapa de destino'; }
      else if (connectFrom !== id) { if (!f.edges.some(([a, b]) => a === connectFrom && b === id)) f.edges.push([connectFrom, id]); connectFrom = null; persist(); drawNodes(); $('#fnHint').textContent = 'Conectado! Clique em outra origem ou desligue "Conectar".'; }
      return;
    }
    const sx = e.clientX, sy = e.clientY, ox = n.x, oy = n.y; let moved = false;
    const mv = ev => { const dx = (ev.clientX - sx) / vw.z, dy = (ev.clientY - sy) / vw.z; if (Math.abs(dx) + Math.abs(dy) > 3) moved = true; n.x = Math.round(ox + dx); n.y = Math.round(oy + dy); el2.style.left = n.x + 'px'; el2.style.top = n.y + 'px'; drawEdges(); };
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); if (moved) persist(); else { selected = id; drawNodes(); panel(); } };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  }
  wrap.addEventListener('pointerdown', e => {
    if (e.target.closest('.fn-toolbar,.fn-zoom,.fn-node,[data-e]')) return;
    const sx = e.clientX, sy = e.clientY, ox = vw.x, oy = vw.y; wrap.classList.add('panning');
    const mv = ev => { vw.x = ox + ev.clientX - sx; vw.y = oy + ev.clientY - sy; stage.style.transform = `translate(${vw.x}px,${vw.y}px) scale(${vw.z})`; };
    const up = () => { wrap.classList.remove('panning'); window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); applyView(); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  });
  wrap.addEventListener('wheel', e => {
    e.preventDefault(); const r = wrap.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
    const nz = clamp(vw.z * (e.deltaY < 0 ? 1.1 : 0.9), 0.3, 2);
    vw.x = mx - (mx - vw.x) * nz / vw.z; vw.y = my - (my - vw.y) * nz / vw.z; vw.z = nz; applyView();
  }, { passive: false });
  const zoom = k => { vw.z = clamp(vw.z * k, 0.3, 2); applyView(); };
  const fit = () => {
    if (!f.nodes.length) return; const r = wrap.getBoundingClientRect();
    const minX = Math.min(...f.nodes.map(n => n.x)), maxX = Math.max(...f.nodes.map(n => n.x + NODE_W)), minY = Math.min(...f.nodes.map(n => n.y)), maxY = Math.max(...f.nodes.map(n => n.y + 110));
    vw.z = clamp(Math.min((r.width - 60) / (maxX - minX), (r.height - 100) / (maxY - minY)), 0.3, 1.3);
    vw.x = (r.width - (maxX - minX) * vw.z) / 2 - minX * vw.z; vw.y = (r.height - (maxY - minY) * vw.z) / 2 - minY * vw.z + 20; applyView();
  };
  $('#zIn', el).onclick = () => zoom(1.15); $('#zOut', el).onclick = () => zoom(0.87); $('#zFit', el).onclick = fit;
  $('#fnBack', el).onclick = () => { state.ui.funnelId = null; state.ui.fnTab = 'mine'; App.render(); };
  $('#fnName', el).onchange = e => { f.name = e.target.value; persist(); };
  $('#fnPrint', el).onclick = () => window.print();
  $('#fnAdd', el).onclick = () => {
    const t = $('#fnType', el).value, r = wrap.getBoundingClientRect();
    const n = { id: uid(), t, n: NODE_TYPES[t].n, d: '', x: Math.round((r.width / 2 - vw.x) / vw.z - NODE_W / 2), y: Math.round((r.height / 2 - vw.y) / vw.z - 40), rate: '' };
    if (selected) { const s = f.nodes.find(x => x.id === selected); if (s) { n.x = s.x + 240; n.y = s.y; f.edges.push([s.id, n.id]); } }
    f.nodes.push(n); selected = n.id; persist(); drawNodes(); panel();
  };
  $('#fnConnect', el).onclick = e => { connectMode = !connectMode; connectFrom = null; e.currentTarget.classList.toggle('primary', connectMode); $('#fnHint').textContent = connectMode ? 'Modo conectar: clique na etapa de origem' : 'Arraste etapas · arraste o fundo para mover · roda do mouse = zoom'; drawNodes(); };
  $('#fnLayout', el).onclick = () => {
    const inc = {}; f.nodes.forEach(n => inc[n.id] = 0); f.edges.forEach(([, b]) => inc[b] = (inc[b] || 0) + 1);
    const lvl = {}, q = f.nodes.filter(n => !inc[n.id]).map(n => n.id); q.forEach(id => lvl[id] = 0);
    let guard = 0; while (q.length && guard++ < 500) { const id = q.shift(); f.edges.filter(([a]) => a === id).forEach(([, b]) => { if (lvl[b] === undefined || lvl[b] < lvl[id] + 1) { if (lvl[id] + 1 < 30) { lvl[b] = lvl[id] + 1; q.push(b); } } }); }
    const rows = {}; f.nodes.forEach(n => { const l = lvl[n.id] ?? 0; rows[l] = (rows[l] || 0); n.x = 40 + l * 240; n.y = 40 + rows[l] * 140; rows[l]++; });
    persist(); drawNodes(); fit();
  };

  function panel() {
    const p = $('#fnPanel', el), n = f.nodes.find(x => x.id === selected);
    if (!n) { p.innerHTML = `<h3>${ico('mouse-pointer')}Etapa</h3><p class="muted small">Clique numa etapa do mapa para editar nome, descrição e taxa de conversão.</p>${F.area('notes', 'Anotações do funil', f.notes || '', 4, 'id="fnNotes"')}`; $('#fnNotes', p).onchange = e => { f.notes = e.target.value; persist(); }; icons(); return; }
    p.innerHTML = `<h3>${ico('pencil')}Editar etapa</h3>${F.text('n', 'Nome', n.n)}${F.select('t', 'Tipo', Object.entries(NODE_TYPES).map(([k, v]) => [k, v.n]), n.t)}${F.area('d', 'Descrição / ação', n.d, 3)}
      ${F.num('rate', 'Taxa de conversão desta etapa (%) — vazio = fora do simulador', n.rate)}
      <div class="row"><button class="btn sm danger" id="ndDel">${ico('trash-2')}Excluir etapa</button><span class="sp"></span><button class="btn sm" id="ndDone">Fechar</button></div>`;
    $$('[name]', p).forEach(i => i.oninput = () => { const d = formData(p); Object.assign(n, d); persist(); drawNodes(); sim(); });
    $('#ndDel', p).onclick = () => { f.nodes = f.nodes.filter(x => x.id !== n.id); f.edges = f.edges.filter(([a, b]) => a !== n.id && b !== n.id); selected = null; persist(); drawNodes(); panel(); sim(); };
    $('#ndDone', p).onclick = () => { selected = null; drawNodes(); panel(); };
    icons();
  }
  function sim() {
    const s = f.sim ||= { mode: 'cpl', cost: 15, invest: 1000, ticket: 450, months: 24, base: 0 };
    const r = simulate(f), box = $('#fnSim', el);
    const maxV = Math.max(1, r.rows[0]?.value || 1);
    box.innerHTML = `<h3>${ico('calculator')}Simulador do funil</h3><div class="form-row">
      ${F.select('mode', 'Entrada', [['cpl', 'Custo por lead'], ['cpc', 'Custo por clique'], ['reach', 'Alcance orgânico'], ['base', 'Carteira de clientes']], s.mode)}
      ${s.mode === 'cpl' || s.mode === 'cpc' ? F.num('invest', 'Investimento/mês (R$)', s.invest) + F.num('cost', s.mode === 'cpl' ? 'CPL (R$)' : 'CPC (R$)', s.cost) : F.num('base', s.mode === 'base' ? 'Clientes ativos' : 'Pessoas alcançadas/mês', s.base)}
      ${s.mode === 'cpc' ? F.num('firstRate', '% que inicia (ex.: página)', s.firstRate) : ''}
      ${F.num('ticket', 'Honorário mensal (R$)', s.ticket)}${F.num('months', 'Permanência média (meses)', s.months)}</div>
      <div class="funnel-bars mt-s">${r.rows.map(x => `<div class="fb" style="width:${clamp(x.value / maxV * 100, 28, 100)}%"><span>${esc(x.name)}${x.rate !== undefined ? ` <small style="opacity:.8">(${x.rate}%)</small>` : ''}</span><span>${fmt.num(x.value, x.value < 10 ? 1 : 0)}</span></div>`).join('')}</div>
      <div class="grid g2 mt"><div><div class="muted small">Novos clientes/mês</div><div style="font-size:22px;font-weight:800">${fmt.num(r.clients, 1)}</div></div><div><div class="muted small">Nova receita recorrente</div><div style="font-size:22px;font-weight:800">${fmt.money(r.mrr)}</div></div>
      ${r.invest ? `<div><div class="muted small">CAC</div><div style="font-size:18px;font-weight:700">${r.cac ? fmt.money(r.cac) : '—'}</div></div><div><div class="muted small">ROI no LTV</div><div style="font-size:18px;font-weight:700" class="${r.roi >= 0 ? 'up' : 'down'}">${fmt.pct(r.roi, 0)}</div></div>` : ''}</div>
      <div class="tip small mt">${simAdvice(r, s)}</div>`;
    $$('[name]', box).forEach(i => i.onchange = () => { Object.assign(s, formData(box)); persist(); sim(); });
    icons();
  }
  applyView(); drawNodes(); panel(); sim();
  if (!vw.fitted) setTimeout(() => { if (stage.isConnected) { fit(); vw.fitted = true; save(); } }, 30);
}
function simAdvice(r, s) {
  if (!r.clients) return 'Defina taxas de conversão nas etapas (clique numa etapa) para ver a projeção.';
  const ltvcac = r.cac ? r.ltv / r.cac : 0;
  if (r.cac && ltvcac < 3) return `⚠️ LTV/CAC de ${fmt.num(ltvcac, 1)}x — abaixo do ideal (3x+). Melhore a etapa de menor conversão ou reduza o custo por lead com novos criativos.`;
  if (r.cac && ltvcac >= 3) return `✅ LTV/CAC de ${fmt.num(ltvcac, 1)}x. Funil saudável: considere aumentar o investimento aos poucos (20% por semana) mantendo o CPL.`;
  return '💡 Funil orgânico: o maior alavancador é aumentar o alcance com Reels e impulsionar os posts com mais salvamentos.';
}
