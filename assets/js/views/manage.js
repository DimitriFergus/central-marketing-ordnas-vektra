/* ===== Vendas, gestão e carreira ===== */

/* ---------- CRM de leads ---------- */
const LEAD_STAGES = [['novo', 'Novo'], ['contato', 'Em contato'], ['diagnostico', 'Diagnóstico'], ['proposta', 'Proposta enviada'], ['ganho', 'Cliente ✅'], ['perdido', 'Perdido']];
const LEAD_SOURCES = ['Instagram orgânico', 'Meta Ads', 'Google Ads', 'Google Meu Negócio', 'Indicação', 'Site', 'WhatsApp', 'Evento / networking', 'Outro'];
function editLead(l = {}) {
  const isNew = !l.id, d = { stage: 'novo', date: today(), source: 'Instagram orgânico', ...l };
  modal({ title: isNew ? 'Novo lead' : d.name, size: 'wide',
    body: `<div class="form-row">${F.text('name', 'Nome', d.name, 'required')}${F.text('company', 'Empresa / segmento', d.company)}${F.text('phone', 'WhatsApp', d.phone)}</div>
      <div class="form-row">${F.select('source', 'Origem', LEAD_SOURCES, d.source)}${F.select('service', 'Interesse', ['', ...Object.values(SVC_NAMES)], d.service)}${F.num('value', 'Honorário mensal (R$)', d.value)}</div>
      <div class="form-row">${F.select('stage', 'Etapa', LEAD_STAGES, d.stage)}${F.date('date', 'Data de entrada', d.date)}${F.date('next', 'Próximo follow-up', d.next)}${F.brand(d.brand, false)}</div>
      ${F.text('lost', 'Motivo da perda (se perdido)', d.lost)}${F.area('notes', 'Anotações', d.notes, 3)}`,
    onSave: x => { if (!x.name) return false; if (isNew) DB.add('leads', x); else DB.update('leads', l.id, x); App.render(); },
    onDelete: isNew ? null : () => { DB.remove('leads', l.id); App.render(); },
    extraBtns: d.phone ? `<a class="btn" target="_blank" href="https://wa.me/${(d.phone.replace(/\D/g, '').length <= 11 ? '55' : '') + d.phone.replace(/\D/g, '')}">${ico('message-circle')}WhatsApp</a>` : '' });
}
view('leads', {
  title: 'CRM de leads', icon: 'users', sub: 'Pipeline comercial — saiba de onde vêm seus clientes',
  render(el) {
    const leads = DB.all('leads');
    const mk = state.ui.leadMonth || '';
    const L = mk ? leads.filter(l => (l.date || '').startsWith(mk)) : leads;
    const won = L.filter(l => l.stage === 'ganho');
    const open = L.filter(l => !['ganho', 'perdido'].includes(l.stage));
    const bySrc = LEAD_SOURCES.map(s => { const a = L.filter(l => l.source === s); return { s, n: a.length, w: a.filter(l => l.stage === 'ganho').length }; }).filter(x => x.n);
    const t = today();
    el.innerHTML = `<div class="row mb"><input type="month" id="lMonth" value="${mk}" style="width:auto"><button class="btn sm" id="lAll">Todos os períodos</button><span class="sp"></span><button class="btn" id="lCsv">${ico('download')}CSV</button><button class="btn primary" id="lNew">${ico('user-plus')}Novo lead</button></div>
      <div class="grid g4 mb">${kpi('users', 'Leads', L.length, `${open.length} em andamento`)}${kpi('trophy', 'Clientes ganhos', won.length, L.length ? fmt.pct(won.length / L.length * 100) + ' de conversão' : '')}${kpi('wallet', 'Receita nova (mensal)', fmt.money(sum(won, x => x.value)), 'soma dos honorários ganhos')}${kpi('hourglass', 'Em negociação', fmt.money(sum(open, x => x.value)), 'pipeline aberto')}</div>
      <div class="kanban">${LEAD_STAGES.map(([k, n]) => { const a = L.filter(l => l.stage === k); return `<div class="kcol" data-col="${k}"><div class="kcol-h"><span>${n}</span><span class="badge">${a.length}</span></div>${a.map(l => `<div class="kcard" draggable="true" data-id="${l.id}"><div class="t">${esc(l.name)}</div><div class="muted small">${esc(l.company || '')}</div><div class="row mt-s"><span class="badge">${esc(l.source)}</span>${l.value ? `<span class="badge ok">${fmt.money(l.value)}</span>` : ''}${l.next ? `<span class="badge ${l.next <= t ? 'bad' : ''}">⏰ ${fmt.date(l.next)}</span>` : ''}${state.brand === 'all' ? brandBadge(l.brand) : ''}</div></div>`).join('')}</div>`; }).join('')}</div>
      <div class="grid g2 mt"><div class="card"><h3>${ico('pie-chart')}Leads por origem</h3>${bySrc.length ? hbars(bySrc.map(x => ({ label: x.s, value: x.n }))) : emptyState('Sem leads')}</div>
      <div class="card"><h3>${ico('percent')}Conversão por origem</h3>${bySrc.length ? `<table class="table small"><tr><th>Origem</th><th>Leads</th><th>Clientes</th><th>Conversão</th></tr>${bySrc.sort((a, b) => b.w / b.n - a.w / a.n).map(x => `<tr><td>${x.s}</td><td>${x.n}</td><td>${x.w}</td><td><strong>${fmt.pct(x.w / x.n * 100)}</strong></td></tr>`).join('')}</table><p class="muted small">Invista mais nas origens com maior conversão.</p>` : emptyState('Sem leads')}</div></div>`;
    $('#lNew', el).onclick = () => editLead();
    $('#lMonth', el).onchange = e => { state.ui.leadMonth = e.target.value; App.render(); };
    $('#lAll', el).onclick = () => { state.ui.leadMonth = ''; App.render(); };
    $('#lCsv', el).onclick = () => download('leads.csv', '﻿' + [['Nome', 'Empresa', 'WhatsApp', 'Origem', 'Interesse', 'Valor', 'Etapa', 'Data', 'Marca'], ...L.map(l => [l.name, l.company, l.phone, l.source, l.service, l.value, l.stage, l.date, l.brand])].map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n'), 'text/csv');
    let drag = null;
    $$('.kcard', el).forEach(c => { c.ondragstart = () => drag = c.dataset.id; c.onclick = () => editLead(DB.get('leads', c.dataset.id)); });
    $$('.kcol', el).forEach(col => { col.ondragover = e => { e.preventDefault(); col.classList.add('drag'); }; col.ondragleave = () => col.classList.remove('drag'); col.ondrop = e => { e.preventDefault(); if (drag) { DB.update('leads', drag, { stage: col.dataset.col }); if (col.dataset.col === 'ganho') toast('🎉 Cliente fechado! Registre no portfólio de resultados.'); App.render(); } }; });
  },
});

/* ---------- Métricas & relatório ---------- */
function editMetric(m = {}) {
  const isNew = !m.id, b = m.brand || curBrand();
  modal({ title: isNew ? 'Registrar mês' : 'Editar mês', size: 'wide',
    body: `<div class="form-row">${F.text('month', 'Mês (AAAA-MM)', m.month || monthKey(), 'type="month"')}${F.brand(b, false)}</div>
      <h4 class="small muted mb">Instagram</h4><div class="form-row">${F.num('followers', 'Seguidores', m.followers)}${F.num('reach', 'Alcance', m.reach)}${F.num('eng', 'Engajamento (%)', m.eng)}${F.num('posts', 'Posts publicados', m.posts)}</div>
      <h4 class="small muted mb">Vendas e tráfego</h4><div class="form-row">${F.num('leads', 'Leads', m.leads)}${F.num('meetings', 'Reuniões', m.meetings)}${F.num('clients', 'Novos clientes', m.clients)}${F.num('invest', 'Investimento em anúncios (R$)', m.invest)}${F.num('revenue', 'Receita nova mensal (R$)', m.revenue)}</div>
      ${F.area('notes', 'O que funcionou / aprendizados', m.notes, 3)}
      <button type="button" class="btn sm" id="mAuto">${ico('wand-2')}Preencher com dados do sistema</button>`,
    onSave: d => { if (isNew) DB.add('metrics', d); else DB.update('metrics', m.id, d); App.render(); },
    onDelete: isNew ? null : () => { DB.remove('metrics', m.id); App.render(); },
    onOpen: f => { $('#mAuto', f).onclick = () => {
      const d = formData(f), mk = d.month, br = d.brand;
      const leads = DB.raw('leads').filter(l => l.brand === br && (l.date || '').startsWith(mk));
      const set = (n, v) => { if (v !== undefined && v !== null) $(`[name=${n}]`, f).value = v; };
      set('leads', leads.length); set('clients', leads.filter(l => l.stage === 'ganho').length); set('meetings', leads.filter(l => ['diagnostico', 'proposta', 'ganho'].includes(l.stage)).length);
      set('revenue', sum(leads.filter(l => l.stage === 'ganho'), x => x.value));
      set('posts', DB.raw('posts').filter(p => p.brand === br && (p.date || '').startsWith(mk) && p.status === 'publicado').length);
      if (state.ig[br]?.profile) set('followers', state.ig[br].profile.followers_count);
      const ig = DB.raw('igposts').filter(p => p.brand === br && p.date.startsWith(mk));
      if (ig.length) { set('reach', sum(ig, p => p.reach)); set('eng', avg(ig, p => engRate(p, state.ig[br]?.profile?.followers_count)).toFixed(2)); }
      toast('Dados preenchidos a partir do CRM, calendário e Instagram');
    }; } });
}
view('metrics', {
  title: 'Métricas & relatórios', icon: 'line-chart', sub: 'Acompanhe resultados e gere o relatório mensal',
  render(el) {
    const ms = DB.all('metrics').sort((a, b) => a.month.localeCompare(b.month) || a.brand.localeCompare(b.brand));
    const lbl = m => MONTHS[+m.month.slice(5) - 1].slice(0, 3) + '/' + m.month.slice(2, 4);
    const show = state.brand === 'all' ? Object.values(ms.reduce((acc, m) => { const a = acc[m.month] ||= { month: m.month, brand: 'both' }; ['followers', 'reach', 'posts', 'leads', 'meetings', 'clients', 'invest', 'revenue'].forEach(k => a[k] = num(a[k]) + num(m[k])); return acc; }, {})) : ms;
    const L = show.slice(-12);
    el.innerHTML = `<div class="row mb"><span class="muted small">${state.brand === 'all' ? 'Somando as duas marcas' : ''}</span><span class="sp"></span><button class="btn" id="mRep">${ico('file-bar-chart')}Gerar relatório do mês</button><button class="btn primary" id="mNew">${ico('plus')}Registrar mês</button></div>
      ${L.length ? `<div class="grid g2"><div class="card"><h3>${ico('users')}Seguidores e alcance</h3>${lineChart([{ name: 'Seguidores', color: '#2563eb', data: L.map(m => num(m.followers)) }, { name: 'Alcance', color: '#c9a227', data: L.map(m => num(m.reach)) }], L.map(lbl))}</div>
        <div class="card"><h3>${ico('target')}Leads e clientes</h3>${lineChart([{ name: 'Leads', color: '#16a34a', data: L.map(m => num(m.leads)) }, { name: 'Clientes', color: '#e11d48', data: L.map(m => num(m.clients)) }], L.map(lbl))}</div>
        <div class="card"><h3>${ico('wallet')}CPL e CAC</h3>${lineChart([{ name: 'CPL', color: '#7c3aed', data: L.map(m => num(m.leads) ? num(m.invest) / num(m.leads) : 0) }, { name: 'CAC', color: '#ea580c', data: L.map(m => num(m.clients) ? num(m.invest) / num(m.clients) : 0) }], L.map(lbl), { money: true })}</div>
        <div class="card"><h3>${ico('banknote')}Investimento x receita nova</h3>${lineChart([{ name: 'Investimento', color: '#dc2626', data: L.map(m => num(m.invest)) }, { name: 'Receita nova mensal', color: '#16a34a', data: L.map(m => num(m.revenue)) }], L.map(lbl), { money: true })}</div></div>` : ''}
      <div class="card mt"><h3>${ico('table')}Histórico mensal</h3><div class="table-wrap"><table class="table"><thead><tr><th>Mês</th>${state.brand === 'all' ? '' : '<th>Marca</th>'}<th>Seguidores</th><th>Alcance</th><th>Posts</th><th>Leads</th><th>Clientes</th><th>Invest.</th><th>CPL</th><th>CAC</th><th>Receita nova</th><th>ROI 12m</th></tr></thead><tbody>
      ${[...show].reverse().map(m => { const cpl = num(m.leads) ? num(m.invest) / num(m.leads) : 0, cac = num(m.clients) ? num(m.invest) / num(m.clients) : 0, roi = num(m.invest) ? (num(m.revenue) * 12 - num(m.invest)) / num(m.invest) * 100 : 0;
        return `<tr ${m.id ? `style="cursor:pointer" data-m="${m.id}"` : ''}><td><strong>${lbl(m)}</strong></td>${state.brand === 'all' ? '' : `<td>${brandBadge(m.brand)}</td>`}<td>${fmt.num(m.followers)}</td><td>${fmt.num(m.reach)}</td><td>${fmt.num(m.posts)}</td><td>${fmt.num(m.leads)}</td><td>${fmt.num(m.clients)}</td><td>${fmt.money(m.invest)}</td><td>${cpl ? fmt.money(cpl) : '—'}</td><td>${cac ? fmt.money(cac) : '—'}</td><td>${fmt.money(m.revenue)}</td><td class="${roi >= 0 ? 'up' : 'down'}">${num(m.invest) ? fmt.pct(roi, 0) : '—'}</td></tr>`; }).join('') || `<tr><td colspan="12">${emptyState('Registre o primeiro mês para acompanhar a evolução.', 'line-chart')}</td></tr>`}</tbody></table></div></div>`;
    $('#mNew', el).onclick = () => editMetric();
    $$('[data-m]', el).forEach(r => r.onclick = () => editMetric(DB.get('metrics', r.dataset.m)));
    $('#mRep', el).onclick = () => monthlyReport(show);
  },
});
function monthlyReport(show) {
  const mk = prompt('Mês do relatório (AAAA-MM):', show.length ? show[show.length - 1].month : monthKey());
  if (!mk) return;
  const i = show.findIndex(m => m.month === mk);
  if (i < 0) { toast('Não há métricas registradas para este mês'); return; }
  const m = show[i], p = show[i - 1];
  const bn = state.brand === 'all' ? 'ORDNAS + VEKTRA Contabilidade' : BRANDS[state.brand].full;
  const delta = (k) => p && num(p[k]) ? ((num(m[k]) - num(p[k])) / num(p[k]) * 100) : null;
  const card = (n, v, k, money) => { const d = delta(k); return `<div class="k"><div class="l">${n}</div><div class="v">${money ? fmt.money(v) : fmt.num(v)}</div>${d !== null ? `<div class="${d >= 0 ? 'g' : 'r'}">${d >= 0 ? '▲' : '▼'} ${fmt.pct(Math.abs(d), 0)} vs mês anterior</div>` : ''}</div>`; };
  const cpl = num(m.leads) ? num(m.invest) / num(m.leads) : 0, cac = num(m.clients) ? num(m.invest) / num(m.clients) : 0;
  const posts = DB.all('posts').filter(x => (x.date || '').startsWith(mk));
  const ins = [];
  if (delta('leads') !== null) ins.push(delta('leads') >= 0 ? `Leads cresceram ${fmt.pct(delta('leads'), 0)} em relação ao mês anterior.` : `Leads caíram ${fmt.pct(-delta('leads'), 0)} — revisar criativos e frequência de posts de conversão.`);
  if (cac && num(m.revenue)) ins.push(`Cada novo cliente custou ${fmt.money(cac)} e gera em média ${fmt.money(num(m.revenue) / Math.max(1, num(m.clients)))} por mês — o investimento se paga em ${fmt.num(cac / (num(m.revenue) / Math.max(1, num(m.clients))), 1)} meses.`);
  if (posts.length) ins.push(`${posts.filter(x => x.status === 'publicado').length} de ${posts.length} posts planejados foram publicados (${fmt.pct(posts.filter(x => x.status === 'publicado').length / posts.length * 100, 0)} de execução).`);
  const w = window.open('', '_blank');
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório ${mk} — ${bn}</title><style>
    body{font-family:Inter,Segoe UI,Arial,sans-serif;color:#0f172a;max-width:900px;margin:30px auto;padding:0 24px}h1{margin:0;font-size:26px}.sub{color:#64748b;margin:4px 0 24px}
    .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.k{border:1px solid #e2e8f0;border-radius:12px;padding:14px}.l{font-size:12px;color:#64748b;font-weight:600}.v{font-size:24px;font-weight:800;margin-top:4px}.g{color:#16a34a;font-size:12px}.r{color:#dc2626;font-size:12px}
    h2{font-size:16px;margin:28px 0 10px;border-bottom:2px solid ${profile().color};padding-bottom:6px}li{margin:6px 0}.bar{height:6px;background:linear-gradient(90deg,${profile().color},${profile().color2});border-radius:4px;margin-bottom:24px}
    button{padding:10px 18px;border-radius:8px;border:0;background:#0f172a;color:#fff;font-weight:600;cursor:pointer}@media print{button{display:none}}</style></head><body>
    <div class="bar"></div><h1>Relatório de Marketing — ${MONTHS[+mk.slice(5) - 1]} ${mk.slice(0, 4)}</h1><p class="sub">${bn} · gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
    <h2>Resultados de vendas</h2><div class="grid">${card('Leads', m.leads, 'leads')}${card('Reuniões', m.meetings, 'meetings')}${card('Novos clientes', m.clients, 'clients')}${card('Receita nova mensal', m.revenue, 'revenue', true)}</div>
    <h2>Tráfego pago</h2><div class="grid">${card('Investimento', m.invest, 'invest', true)}<div class="k"><div class="l">CPL</div><div class="v">${cpl ? fmt.money(cpl) : '—'}</div></div><div class="k"><div class="l">CAC</div><div class="v">${cac ? fmt.money(cac) : '—'}</div></div><div class="k"><div class="l">ROI (12 meses)</div><div class="v">${num(m.invest) ? fmt.pct((num(m.revenue) * 12 - num(m.invest)) / num(m.invest) * 100, 0) : '—'}</div></div></div>
    <h2>Instagram</h2><div class="grid">${card('Seguidores', m.followers, 'followers')}${card('Alcance', m.reach, 'reach')}${card('Posts publicados', m.posts, 'posts')}<div class="k"><div class="l">Engajamento</div><div class="v">${m.eng ? fmt.pct(m.eng, 2) : '—'}</div></div></div>
    <h2>Principais leituras</h2><ul>${ins.map(x => `<li>${x}</li>`).join('') || '<li>Registre mais meses para comparações.</li>'}</ul>
    ${m.notes ? `<h2>Aprendizados do mês</h2><p>${esc(m.notes).replace(/\n/g, '<br>')}</p>` : ''}
    <h2>Próximos passos</h2><ul><li>[Preencha: ação 1 — ex.: escalar o criativo vencedor em 20%]</li><li>[Ação 2 — ex.: lançar funil de troca de contador]</li><li>[Ação 3 — ex.: aumentar Reels para 40% do calendário]</li></ul>
    <p style="margin-top:30px"><button onclick="window.print()">Imprimir / salvar em PDF</button></p></body></html>`);
  w.document.close();
}

/* ---------- Metas ---------- */
const GOAL_AUTO = [['', 'Manual'], ['leads', 'Leads no mês (CRM)'], ['clients', 'Clientes no mês (CRM)'], ['posts', 'Posts publicados no mês'], ['followers', 'Seguidores (Instagram)'], ['revenue', 'Receita nova no mês (CRM)']];
function goalCurrent(g) {
  const mk = monthKey(), br = g.brand;
  const leads = DB.raw('leads').filter(l => (br === 'both' || l.brand === br) && (l.date || '').startsWith(mk));
  switch (g.auto) {
    case 'leads': return leads.length;
    case 'clients': return leads.filter(l => l.stage === 'ganho').length;
    case 'revenue': return sum(leads.filter(l => l.stage === 'ganho'), x => x.value);
    case 'posts': return DB.raw('posts').filter(p => (br === 'both' || p.brand === br) && (p.date || '').startsWith(mk) && p.status === 'publicado').length;
    case 'followers': return br === 'both' ? sum(['ordnas', 'vektra'], b => state.ig[b]?.profile?.followers_count || 0) : state.ig[br]?.profile?.followers_count || num(g.current);
    default: return num(g.current);
  }
}
view('goals', {
  title: 'Metas & OKRs', icon: 'target', sub: 'Objetivos claros, progresso visível',
  render(el) {
    const gs = DB.all('goals');
    gs.forEach(g => { if (g.auto) g.current = goalCurrent(g); }); save();
    el.innerHTML = `<div class="row mb"><button class="btn" id="gSug">${ico('sparkles')}Sugerir metas</button><span class="sp"></span><button class="btn primary" id="gNew">${ico('plus')}Nova meta</button></div>
      <div class="grid g3">${gs.map(g => { const p = clamp(num(g.current) / Math.max(1, num(g.target)) * 100, 0, 100); const days = g.deadline ? Math.ceil((parseYMD(g.deadline) - parseYMD(today())) / 864e5) : null;
        return `<div class="card" style="cursor:pointer" data-g="${g.id}"><div class="row">${state.brand === 'all' ? brandBadge(g.brand) : ''}${g.auto ? '<span class="badge info">automática</span>' : ''}${days !== null ? `<span class="badge ${days < 0 ? 'bad' : days < 7 ? 'warn' : ''}">${days < 0 ? 'vencida' : days + ' dias'}</span>` : ''}</div>
          <h3 class="mt-s" style="margin-bottom:8px">${esc(g.name)}</h3><div class="row"><span style="font-size:24px;font-weight:800">${fmt.num(g.current)}</span><span class="muted">/ ${fmt.num(g.target)} ${esc(g.unit || '')}</span><span class="sp"></span><strong>${fmt.pct(p, 0)}</strong></div>
          <div class="progress mt-s"><div style="width:${p}%"></div></div>${g.why ? `<p class="muted small">${esc(g.why)}</p>` : ''}</div>`; }).join('') || `<div class="card" style="grid-column:1/-1">${emptyState('Nenhuma meta. Clique em “Sugerir metas” para começar com metas típicas de um escritório contábil.', 'target')}</div>`}</div>`;
    const edit = (g = {}) => modal({ title: g.id ? 'Editar meta' : 'Nova meta', body: `${F.text('name', 'Meta', g.name)}<div class="form-row">${F.num('target', 'Alvo', g.target)}${F.num('current', 'Atual', g.current)}${F.text('unit', 'Unidade', g.unit)}</div><div class="form-row">${F.select('auto', 'Atualização', GOAL_AUTO, g.auto)}${F.date('deadline', 'Prazo', g.deadline)}</div>${F.brand(g.brand)}${F.text('why', 'Por que essa meta importa', g.why)}`,
      onSave: d => { if (g.id) DB.update('goals', g.id, d); else DB.add('goals', d); App.render(); }, onDelete: g.id ? () => { DB.remove('goals', g.id); App.render(); } : null });
    $('#gNew', el).onclick = () => edit();
    $$('[data-g]', el).forEach(c => c.onclick = () => edit(DB.get('goals', c.dataset.g)));
    $('#gSug', el).onclick = () => {
      const end = ymd(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)), br = genBrand();
      [{ name: 'Novos clientes no mês', target: 6, auto: 'clients', unit: 'clientes', why: 'Meta principal do marketing: gerar receita.' }, { name: 'Leads qualificados no mês', target: 60, auto: 'leads', unit: 'leads' }, { name: 'Posts publicados no mês', target: 16, auto: 'posts', unit: 'posts', why: 'Consistência gera alcance.' }, { name: 'Receita nova recorrente', target: 3000, auto: 'revenue', unit: 'R$' }]
        .forEach(g => DB.add('goals', { ...g, brand: br, current: 0, deadline: end }));
      App.render();
    };
  },
});

/* ---------- Concorrentes ---------- */
view('competitors', {
  title: 'Concorrentes', icon: 'swords', sub: 'Benchmark e oportunidades de diferenciação',
  render(el) {
    const cs = DB.all('competitors');
    el.innerHTML = `<div class="row mb"><span class="muted small">Acompanhe 3 a 5 concorrentes e 2 referências de fora da sua cidade.</span><span class="sp"></span><button class="btn primary" id="cNew">${ico('plus')}Adicionar concorrente</button></div>
      <div class="grid g3">${cs.map(c => `<div class="card"><div class="row"><strong>${esc(c.name)}</strong>${state.brand === 'all' ? brandBadge(c.brand) : ''}<span class="sp"></span>${c.handle ? `<a class="btn xs" target="_blank" href="https://instagram.com/${esc(c.handle.replace('@', ''))}">${esc(c.handle)}</a>` : ''}</div>
        <div class="row mt-s small muted">${c.followers ? `👥 ${fmt.num(c.followers)}` : ''} ${c.freq ? `· 📅 ${esc(c.freq)}` : ''} ${c.updated ? `· atualizado ${fmt.date(c.updated)}` : ''}</div>
        ${c.strong ? `<p class="small"><strong class="up">Fortes:</strong> ${esc(c.strong)}</p>` : ''}${c.weak ? `<p class="small"><strong class="down">Fracos:</strong> ${esc(c.weak)}</p>` : ''}${c.ideas ? `<p class="small"><strong>Oportunidades:</strong> ${esc(c.ideas)}</p>` : ''}
        <div class="row mt-s"><button class="btn xs" data-e="${c.id}">${ico('pencil')}Editar</button><button class="btn xs" data-open="claude" data-for="${c.id}">${ico('external-link')}Analisar com IA</button></div></div>`).join('') || `<div class="card" style="grid-column:1/-1">${emptyState('Nenhum concorrente cadastrado.', 'swords')}</div>`}</div>`;
    const edit = (c = {}) => modal({ title: c.id ? c.name : 'Novo concorrente', size: 'wide', body: `<div class="form-row">${F.text('name', 'Nome', c.name)}${F.text('handle', '@ do Instagram', c.handle)}${F.num('followers', 'Seguidores', c.followers)}${F.text('freq', 'Frequência de posts', c.freq, 'placeholder="ex.: 4x/semana"')}</div>${F.brand(c.brand)}
      ${F.area('strong', 'Pontos fortes (o que fazem bem)', c.strong, 2)}${F.area('weak', 'Pontos fracos', c.weak, 2)}${F.area('ideas', 'Oportunidades para nós', c.ideas, 2)}${F.area('offers', 'Ofertas / preços que divulgam', c.offers, 2)}`,
      onSave: d => { d.updated = today(); if (c.id) DB.update('competitors', c.id, d); else DB.add('competitors', d); App.render(); }, onDelete: c.id ? () => { DB.remove('competitors', c.id); App.render(); } : null });
    $('#cNew', el).onclick = () => edit();
    $$('[data-e]', el).forEach(b => b.onclick = () => edit(DB.get('competitors', b.dataset.e)));
    wireAI(el, id => { const c = DB.get('competitors', id); return tpl(PROMPTS.find(p => p.n === 'Análise de concorrente').p, brandVars(c.brand === 'both' ? curBrand() : c.brand)).replace('[@perfil]', c.handle || c.name) + `\nO que já observei: fortes: ${c.strong || '-'}; fracos: ${c.weak || '-'}; ofertas: ${c.offers || '-'}.`; }, () => { });
  },
});

/* ---------- Rotina & carreira ---------- */
function periodKey(kind) {
  const d = new Date();
  if (kind === 'diaria') return ymd(d);
  if (kind === 'mensal') return monthKey(d);
  const t = new Date(d); t.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return 'w' + ymd(t);
}
view('routine', {
  title: 'Rotina & carreira', icon: 'briefcase', sub: 'Checklists do analista, portfólio de resultados e desenvolvimento', isNew: true,
  render(el) {
    const tb = tabs('rtTab', [['rot', 'Rotina do analista'], ['wins', `Portfólio de resultados (${DB.raw('wins').length})`], ['learn', 'Desenvolvimento profissional']]);
    el.innerHTML = tb.html + '<div id="rtBody"></div>';
    const body = $('#rtBody', el);
    const R = state.routine; R.custom ||= { diaria: [], semanal: [], mensal: [] }; R.done ||= {};
    if (tb.cur === 'rot') {
      body.innerHTML = `<div class="grid g3">${['diaria', 'semanal', 'mensal'].map(k => { const items = [...ROUTINE[k], ...R.custom[k]], pk = periodKey(k), done = R.done[pk] || []; const p = items.length ? done.length / items.length * 100 : 0;
        return `<div class="card"><div class="card-head"><h3>${ico(k === 'diaria' ? 'sun' : k === 'semanal' ? 'calendar-range' : 'calendar')}${k === 'diaria' ? 'Hoje' : k === 'semanal' ? 'Esta semana' : 'Este mês'}</h3><span class="sp"></span><strong>${fmt.pct(p, 0)}</strong></div><div class="progress mb"><div style="width:${p}%"></div></div>
          ${items.map((it, i) => `<label class="chk" style="padding:5px 0"><input type="checkbox" data-k="${k}" data-i="${esc(it)}" ${done.includes(it) ? 'checked' : ''}> <span style="${done.includes(it) ? 'text-decoration:line-through;opacity:.6' : ''}">${esc(it)}</span>${i >= ROUTINE[k].length ? ` <button class="btn xs ghost" data-rmc="${k}|${esc(it)}">✕</button>` : ''}</label>`).join('')}
          <form class="row mt-s" data-add="${k}"><input name="t" placeholder="Adicionar tarefa…"><button class="btn sm">${ico('plus')}</button></form></div>`; }).join('')}</div>
        <div class="tip mt small">As listas zeram automaticamente a cada novo dia, semana e mês. Personalize com as tarefas da sua rotina.</div>`;
      $$('[data-k]', body).forEach(c => c.onchange = () => { const pk = periodKey(c.dataset.k); const a = R.done[pk] ||= []; if (c.checked) a.push(c.dataset.i); else R.done[pk] = a.filter(x => x !== c.dataset.i); save(); App.render(); });
      $$('[data-add]', body).forEach(f => f.onsubmit = e => { e.preventDefault(); const t = formData(f).t.trim(); if (t) { R.custom[f.dataset.add].push(t); save(); App.render(); } });
      $$('[data-rmc]', body).forEach(b => b.onclick = e => { e.preventDefault(); const [k, t] = b.dataset.rmc.split('|'); R.custom[k] = R.custom[k].filter(x => x !== t); save(); App.render(); });
      return;
    }
    if (tb.cur === 'wins') {
      const ws = DB.all('wins').sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      body.innerHTML = `<div class="tip mb">Registre cada resultado que você gerou. Isso vira seu portfólio para negociar aumento, apresentar à diretoria ou montar seu currículo.</div>
        <div class="row mb"><span class="sp"></span><button class="btn" id="wExp">${ico('file-down')}Exportar portfólio</button><button class="btn primary" id="wNew">${ico('plus')}Registrar resultado</button></div>
        <div class="list card">${ws.map(w => `<div class="li" style="cursor:pointer" data-w="${w.id}"><span class="badge ok">${fmt.date(w.date)}</span><div class="grow"><div class="t">${esc(w.title)}</div><div class="muted small">${esc(w.metric || '')} ${w.desc ? '— ' + esc(w.desc) : ''}</div></div>${state.brand === 'all' ? brandBadge(w.brand) : ''}</div>`).join('') || emptyState('Nenhum resultado registrado ainda. Ex.: “CPL caiu de R$ 32 para R$ 14 com novo criativo”.', 'trophy')}</div>`;
      const edit = (w = {}) => modal({ title: w.id ? 'Editar resultado' : 'Novo resultado', body: `${F.text('title', 'Conquista', w.title, 'placeholder="Ex.: Recorde de leads em um mês"')}${F.text('metric', 'Número / métrica', w.metric, 'placeholder="Ex.: +85% de leads (45 → 83)"')}<div class="form-row">${F.date('date', 'Data', w.date || today())}${F.brand(w.brand)}</div>${F.area('desc', 'O que você fez (ação → resultado)', w.desc, 4)}`,
        onSave: d => { if (w.id) DB.update('wins', w.id, d); else DB.add('wins', d); App.render(); }, onDelete: w.id ? () => { DB.remove('wins', w.id); App.render(); } : null });
      $('#wNew', body).onclick = () => edit();
      $$('[data-w]', body).forEach(r => r.onclick = () => edit(DB.get('wins', r.dataset.w)));
      $('#wExp', body).onclick = () => download('portfolio-resultados.md', `# Portfólio de resultados — Marketing\n\n` + ws.map(w => `## ${w.title}\n- **Data:** ${w.date}\n- **Marca:** ${BRANDS[w.brand]?.full || 'Ambas'}\n- **Resultado:** ${w.metric || '-'}\n\n${w.desc || ''}\n`).join('\n'), 'text/markdown');
      return;
    }
    const ls = DB.raw('learn');
    const SUG = ['Gestor de tráfego Meta Ads (Blueprint)', 'Google Ads — certificação de Pesquisa', 'Copywriting para redes sociais', 'Edição de vídeo para Reels (CapCut)', 'Google Analytics 4', 'Marketing para serviços contábeis', 'Inteligência artificial aplicada ao marketing', 'Design no Canva / Figma', 'Funis de vendas e automação', 'Oratória e gravação de vídeos'];
    body.innerHTML = `<div class="grid g-side"><div class="card"><div class="card-head"><h3>${ico('graduation-cap')}Plano de estudos</h3><span class="sp"></span><button class="btn sm primary" id="lNew">${ico('plus')}Adicionar</button></div>
      <div class="list">${ls.map(l => `<div class="li"><input type="checkbox" data-l="${l.id}" ${l.done ? 'checked' : ''}><div class="grow"><div class="t" style="${l.done ? 'text-decoration:line-through;opacity:.6' : ''}">${esc(l.name)}</div><div class="muted small">${esc(l.type || '')} ${l.link ? `· <a href="${esc(l.link)}" target="_blank">abrir</a>` : ''}</div></div><button class="btn xs danger" data-rml="${l.id}">${ico('x')}</button></div>`).join('') || emptyState('Adicione cursos, livros e certificações.', 'graduation-cap')}</div></div>
      <div class="card"><h3>${ico('sparkles')}Sugestões para analista de marketing</h3>${SUG.map(s => `<div class="li small"><div class="grow">${s}</div><button class="btn xs" data-sug="${esc(s)}">${ico('plus')}</button></div>`).join('')}</div></div>`;
    const add = (name = '') => modal({ title: 'Novo item de estudo', body: `${F.text('name', 'Nome', name)}${F.select('type', 'Tipo', ['Curso', 'Certificação', 'Livro', 'Evento', 'Mentoria'])}${F.text('link', 'Link')}`, onSave: d => { DB.raw('learn').push({ ...d, id: uid(), done: false }); save(); App.render(); } });
    $('#lNew', body).onclick = () => add();
    $$('[data-sug]', body).forEach(b => b.onclick = () => add(b.dataset.sug));
    $$('[data-l]', body).forEach(c => c.onchange = () => { const l = ls.find(x => x.id === c.dataset.l); l.done = c.checked; save(); App.render(); });
    $$('[data-rml]', body).forEach(b => b.onclick = () => { state.col.learn = ls.filter(x => x.id !== b.dataset.rml); save(); App.render(); });
  },
});

/* ---------- Marca & IA ---------- */
view('brand', {
  title: 'Marca & IA', icon: 'palette', sub: 'Identidade das marcas — usada em todos os geradores',
  render(el) {
    const tb = tabs('brandTab', [['ordnas', 'ORDNAS Contabilidade'], ['vektra', 'VEKTRA Contabilidade'], ['ia', 'Integrações & IA']], state.brand === 'vektra' ? 'vektra' : 'ordnas');
    el.innerHTML = tb.html + '<div id="brBody"></div>';
    const body = $('#brBody', el);
    if (tb.cur === 'ia') {
      const s = state.settings ||= {};
      body.innerHTML = `<div class="grid g2"><div class="card"><h3>${ico('sparkles')}IA integrada (Claude)</h3>
        <p class="small">Com uma chave da API da Anthropic, os botões <strong>“Gerar com IA”</strong> escrevem roteiros, legendas, copies e análises completas aqui mesmo, usando os dados da marca. Sem chave, os botões abrem o Claude ou o ChatGPT com o prompt pronto.</p>
        <form id="iaForm">${F.text('aiKey', 'Chave da API (sk-ant-…)', s.aiKey || '', 'type="password" autocomplete="off"')}
        <div class="form-row">${F.select('aiModel', 'Modelo', [['claude-opus-5-5', 'Claude Opus 5.5 (melhor qualidade)'], ['claude-sonnet-5-5', 'Claude Sonnet 5.5 (rápido e mais barato)'], ['claude-haiku-5-5', 'Claude Haiku 5.5 (o mais econômico)']], s.aiModel || 'claude-opus-5-5')}
        ${F.select('aiEffort', 'Profundidade', [['low', 'Rápida'], ['medium', 'Equilibrada'], ['high', 'Caprichada']], s.aiEffort || 'low')}</div></form>
        <div class="row"><button class="btn primary" id="iaSave">${ico('save')}Salvar</button><button class="btn" id="iaTest">${ico('zap')}Testar</button></div><div id="iaMsg" class="small mt"></div>
        <p class="muted small mt">Crie sua chave em <a href="https://console.anthropic.com/settings/keys" target="_blank">console.anthropic.com</a>. O uso é cobrado pela Anthropic por volume de texto. A chave fica salva só neste navegador.</p></div>
        <div class="card"><h3>${ico('plug')}Outras integrações</h3><div class="list small">
          <div class="li"><div class="grow"><strong>Instagram (Meta Graph API)</strong><div class="muted">Métricas reais dos posts e recomendações automáticas.</div></div><a class="btn xs" href="#/instagram">Configurar</a></div>
          <div class="li"><div class="grow"><strong>Links rastreáveis</strong><div class="muted">UTM e WhatsApp com origem identificada.</div></div><a class="btn xs" href="#/utm">Abrir</a></div>
          <div class="li"><div class="grow"><strong>Exportação CSV</strong><div class="muted">Calendário e leads abrem no Excel / Google Planilhas.</div></div></div></div></div></div>`;
      const keep = () => { Object.assign(s, formData($('#iaForm', body))); s.aiKey = s.aiKey.trim(); save(); };
      $('#iaSave', body).onclick = () => { keep(); toast('Configurações salvas'); };
      $('#iaTest', body).onclick = async () => { keep(); $('#iaMsg', body).textContent = 'Testando…'; try { const t = await aiGenerate('Responda apenas: "Conexão funcionando! ✅" e uma dica de marketing para contadores em 1 frase.'); $('#iaMsg', body).innerHTML = `<span class="up">${esc(t)}</span>`; } catch (e) { $('#iaMsg', body).innerHTML = `<span class="down">Erro: ${esc(e.message)}</span>`; } };
      return;
    }
    const b = tb.cur, p = profile(b);
    body.innerHTML = `<div class="grid g-side"><div class="card"><form id="brForm"><div class="form-row">${F.text('name', 'Nome da marca', p.name)}${F.text('handle', '@ do Instagram', p.handle)}${F.text('city', 'Cidade principal', p.city)}</div>
      <div class="form-row">${F.text('whatsapp', 'WhatsApp comercial', p.whatsapp)}${F.text('site', 'Site / link da bio', p.site)}</div>
      ${F.area('publico', 'Público-alvo (quem você atende)', p.publico, 2)}${F.area('servicos', 'Serviços (separe por vírgula)', p.servicos, 2)}${F.area('diferenciais', 'Diferenciais (separe por vírgula)', p.diferenciais, 2)}
      ${F.area('dores', 'Dores do cliente (separe por vírgula)', p.dores, 2)}<div class="form-row">${F.text('tom', 'Tom de voz', p.tom)}${F.text('pilares', 'Pilares de conteúdo (vírgula)', p.pilares)}</div>
      <div class="form-row"><label class="field"><span>Cor principal</span><input type="color" name="color" value="${p.color}" style="height:40px"></label><label class="field"><span>Cor de destaque</span><input type="color" name="color2" value="${p.color2}" style="height:40px"></label></div></form>
      <div class="row"><button class="btn primary" id="brSave">${ico('save')}Salvar marca</button><button class="btn ghost" id="brReset">Restaurar padrão</button></div></div>
      <div class="grid" style="align-content:start"><div class="card"><h3>${ico('eye')}Prévia</h3><div style="border-radius:14px;padding:18px;background:linear-gradient(135deg,${p.color},${p.color2});color:#fff"><div style="font-weight:800;font-size:18px">${esc(p.name)}</div><div style="opacity:.85">${esc(p.handle)}</div><div class="small" style="margin-top:10px">${esc(p.tom)}</div></div>
        <div class="tip small mt">Quanto mais completo este perfil, melhores ficam legendas, roteiros, prompts e anúncios gerados.</div></div>
        <div class="card"><h3>${ico('user-round')}Persona (gerar com IA)</h3><p class="small muted">Crie personas detalhadas do cliente ideal a partir deste perfil.</p><div class="row">${aiButtons('persona')}</div><div id="persOut"></div></div></div></div>`;
    $('#brSave', body).onclick = () => { Object.assign(state.profiles[b], formData($('#brForm', body))); save(); toast('Marca salva'); App.render(); };
    $('#brReset', body).onclick = () => { if (confirm('Restaurar os dados padrão desta marca?')) { state.profiles[b] = { ...DEFAULT_PROFILES[b] }; save(); App.render(); } };
    wireAI(body, () => tpl(PROMPTS.find(x => x.n.startsWith('Análise de persona')).p, brandVars(b)), t => { $('#persOut', body).innerHTML = `<div class="out mt">${esc(t)}</div>`; });
  },
});

/* ---------- Backup ---------- */
view('backup', {
  title: 'Backup dos dados', icon: 'database', sub: 'Seus dados ficam neste navegador — faça cópias',
  render(el) {
    const size = (JSON.stringify(state).length / 1024).toFixed(0);
    const counts = Object.entries(state.col).map(([k, v]) => `${k}: ${v.length}`).join(' · ');
    el.innerHTML = `<div class="grid g2"><div class="card"><h3>${ico('download')}Exportar</h3><p class="small">Baixa um arquivo com tudo: posts, roteiros, funis, leads, métricas e configurações. Guarde no Google Drive ou OneDrive.</p>
      ${F.check('noSecrets', 'Não incluir tokens e chaves de API', true).replace('name="noSecrets"', 'id="noSecrets"')}<button class="btn primary mt-s" id="bExp">${ico('download')}Baixar backup</button><p class="muted small mt">Tamanho atual: ${size} KB · ${counts || 'sem dados ainda'}</p></div>
      <div class="card"><h3>${ico('upload')}Importar</h3><p class="small">Restaura um backup (substitui os dados atuais). Use também para levar os dados para outro computador.</p><input type="file" id="bFile" accept=".json"><hr>
      <h3>${ico('trash-2')}Apagar tudo</h3><p class="small muted">Remove todos os dados deste navegador.</p><button class="btn danger" id="bReset">Apagar todos os dados</button></div></div>
      <div class="tip warn mt">⚠️ Os dados ficam salvos no navegador deste computador. Se limpar o histórico/cache do navegador, eles podem ser perdidos — por isso a rotina mensal inclui “Backup dos dados”.</div>`;
    $('#bExp', el).onclick = () => { const s = JSON.parse(JSON.stringify(state)); if ($('#noSecrets', el).checked) { Object.values(s.ig || {}).forEach(c => delete c.token); if (s.settings) delete s.settings.aiKey; } download(`backup-central-marketing-${today()}.json`, JSON.stringify(s, null, 1)); };
    $('#bFile', el).onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { const s = JSON.parse(r.result); if (!s.col) throw new Error('arquivo inválido'); if (confirm('Substituir todos os dados atuais por este backup?')) { localStorage.setItem(APP_KEY, JSON.stringify(s)); location.reload(); } } catch (err) { toast('Erro: ' + err.message); } }; r.readAsText(f); };
    $('#bReset', el).onclick = () => { if (confirm('Apagar TODOS os dados? Isso não pode ser desfeito.') && confirm('Tem certeza absoluta?')) { localStorage.removeItem(APP_KEY); location.reload(); } };
  },
});
