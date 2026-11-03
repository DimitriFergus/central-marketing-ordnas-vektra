/* ===== Planejamento: calendário, produção, ideias e datas ===== */

function allPillars() {
  const set = new Set();
  ['ordnas', 'vektra'].forEach(b => (profile(b).pilares || '').split(',').map(s => s.trim()).filter(Boolean).forEach(x => set.add(x)));
  ['Engajamento', 'Tecnologia', 'Gestão e números'].forEach(x => set.add(x));
  return [...set];
}

/* Modal de criação/edição de post (usado em várias telas) */
function editPost(p = {}) {
  const isNew = !p.id;
  const data = { date: today(), time: '12:00', format: 'Reels', status: 'ideia', objective: 'autoridade', ...p };
  modal({
    title: isNew ? 'Novo post' : 'Editar post', size: 'wide',
    body: `<div class="form-row">${F.text('title', 'Título / tema', data.title, 'required')}${F.brand(data.brand)}</div>
      <div class="form-row">${F.date('date', 'Data', data.date)}${F.time('time', 'Horário', data.time)}${F.select('format', 'Formato', FORMATS, data.format)}${F.select('status', 'Status', POST_STATUS, data.status)}</div>
      <div class="form-row">${F.select('pillar', 'Pilar de conteúdo', ['', ...allPillars()], data.pillar)}${F.select('objective', 'Objetivo', OBJECTIVES, data.objective)}${F.text('owner', 'Responsável', data.owner)}</div>
      ${F.area('script', 'Roteiro / estrutura', data.script, 5)}
      ${F.area('caption', 'Legenda', data.caption, 5)}
      <div class="form-row">${F.text('link', 'Link do post / arquivo (Drive, Canva)', data.link)}${F.text('notes', 'Observações', data.notes)}</div>
      <div class="row small"><button type="button" class="btn xs" id="pGenCap">${ico('sparkles')}Gerar legenda para este tema</button><button type="button" class="btn xs" id="pGenScr">${ico('clapperboard')}Gerar roteiro</button></div>`,
    onSave: d => { if (!d.title) { toast('Informe o título'); return false; } if (isNew) DB.add('posts', d); else DB.update('posts', p.id, d); toast('Post salvo'); App.render(); },
    onDelete: isNew ? null : () => { DB.remove('posts', p.id); App.render(); },
    extraBtns: isNew ? '' : `<button type="button" class="btn" id="pDup">${ico('copy')}Duplicar</button>`,
    onOpen: (form, w) => {
      $('#pGenCap', form).onclick = () => { const d = formData(form); const c = buildCaptions({ tema: d.title, objetivo: d.objective, brand: d.brand === 'both' ? 'ordnas' : d.brand, tamanho: 'media', emojis: true, tags: ['Contabilidade', 'Empreendedorismo'] })[0]; $('[name=caption]', form).value = c; };
      $('#pGenScr', form).onclick = () => { const d = formData(form); $('[name=script]', form).value = buildScript({ tema: d.title, estrutura: 'gcc', formato: d.format === 'Carrossel' ? 'carrossel' : d.format === 'Stories' ? 'stories' : 'reels60', brand: d.brand === 'both' ? 'ordnas' : d.brand, objetivo: d.objective }).text; };
      const dup = $('#pDup', w); if (dup) dup.onclick = () => { const d = formData(form); DB.add('posts', { ...d, date: addDays(d.date, 7), status: 'ideia' }); toast('Post duplicado para +7 dias'); w.remove(); App.render(); };
    },
  });
}

function datesForMonth(y, m) {
  const out = {};
  DATES.filter(d => d.m === m + 1).forEach(d => { const k = ymd(new Date(y, m, d.d)); (out[k] ||= []).push(d.t); });
  MONTHLY_DATES.forEach(d => { const k = ymd(new Date(y, m, d.d)); (out[k] ||= []).push(d.t); });
  return out;
}
function upcomingDates(days) {
  const t = today(), end = addDays(t, days), y = new Date().getFullYear(), list = [];
  [y, y + 1].forEach(yy => {
    DATES.forEach(d => list.push({ ...d, date: ymd(new Date(yy, d.m - 1, d.d)) }));
    for (let m = 0; m < 12; m++) MONTHLY_DATES.forEach(d => list.push({ ...d, tipo: 'mensal', date: ymd(new Date(yy, m, d.d)) }));
  });
  return list.filter(d => d.date >= t && d.date <= end).sort((a, b) => a.date.localeCompare(b.date));
}

/* ---------- Calendário ---------- */
view('calendar', {
  title: 'Calendário de posts', icon: 'calendar-days', sub: 'Planeje e acompanhe cada publicação',
  render(el) {
    const mk = state.ui.calMonth || monthKey();
    const [y, m] = mk.split('-').map(Number);
    const first = new Date(y, m - 1, 1);
    const start = new Date(first); start.setDate(1 - first.getDay());
    const filt = state.ui.calFilter || '';
    const posts = DB.all('posts').filter(p => !filt || p.format === filt);
    const evs = datesForMonth(y, m - 1);
    const t = today();
    let cells = '';
    for (let i = 0; i < 42; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const k = ymd(d), dp = posts.filter(p => p.date === k).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
      if (i === 35 && d.getMonth() !== m - 1) break;
      cells += `<div class="day ${d.getMonth() !== m - 1 ? 'out-m' : ''} ${k === t ? 'today' : ''}" data-day="${k}">
        <div class="dn"><span>${d.getDate()}</span>${dp.length ? `<span class="badge">${dp.length}</span>` : ''}</div>
        ${(evs[k] || []).map(e => `<div class="ev" title="${esc(e)}">⚑ ${esc(e)}</div>`).join('')}
        ${dp.map(p => `<div class="post-pill ${p.status === 'publicado' ? 'published' : ''}" data-post="${p.id}" style="border-color:${FORMAT_COLORS[p.format] || '#888'}" title="${esc(p.title)} (${esc(p.format)})">${p.time ? p.time + ' ' : ''}${esc(p.title)}</div>`).join('')}
      </div>`;
    }
    const mp = posts.filter(p => (p.date || '').startsWith(mk));
    const byFmt = FORMATS.map(f => ({ label: f, value: mp.filter(p => p.format === f).length, color: FORMAT_COLORS[f] })).filter(x => x.value);
    const byObj = OBJECTIVES.map(([k, l]) => ({ label: l.split(' ')[0], value: mp.filter(p => p.objective === k).length })).filter(x => x.value);

    el.innerHTML = `
      <div class="row mb">
        <button class="icon-btn" id="calPrev">${ico('chevron-left')}</button>
        <h2 style="font-size:20px;min-width:190px;text-align:center">${MONTHS[m - 1]} ${y}</h2>
        <button class="icon-btn" id="calNext">${ico('chevron-right')}</button>
        <button class="btn sm" id="calToday">Hoje</button>
        <select id="calFilter" style="width:auto"><option value="">Todos os formatos</option>${FORMATS.map(f => `<option ${f === filt ? 'selected' : ''}>${f}</option>`).join('')}</select>
        <span class="sp"></span>
        <button class="btn" id="calExport">${ico('download')}Exportar CSV</button>
        <button class="btn accent" id="calGen">${ico('wand-2')}Gerar plano do mês</button>
        <button class="btn primary" onclick="editPost({date:today()})">${ico('plus')}Novo post</button>
      </div>
      <div class="legend mb">${FORMATS.map(f => `<span><i class="dot" style="background:${FORMAT_COLORS[f]}"></i>${f}</span>`).join('')}<span>⚑ Data fiscal/comemorativa</span></div>
      <div class="cal-head">${WEEKDAYS.map(w => `<div>${w}</div>`).join('')}</div>
      <div class="cal">${cells}</div>
      <div class="grid g3 mt">
        <div class="card"><h3>${ico('pie-chart')}Mix de formatos do mês</h3>${byFmt.length ? hbars(byFmt) : emptyState('Sem posts neste mês')}</div>
        <div class="card"><h3>${ico('crosshair')}Objetivos do mês</h3>${byObj.length ? hbars(byObj) : emptyState('Sem posts neste mês')}</div>
        <div class="card"><h3>${ico('info')}Mix recomendado</h3><div class="small">
          <p><strong>Formatos:</strong> 40% Reels (alcance), 35% Carrossel (autoridade e salvamentos), 15% Post estático, Stories todos os dias.</p>
          <p><strong>Objetivos:</strong> 40% autoridade, 25% alcance, 20% conversão, 15% relacionamento.</p>
          <p><strong>Frequência mínima:</strong> 3 a 5 posts no feed por semana + 3 a 7 stories por dia.</p></div></div>
      </div>`;

    $('#calPrev', el).onclick = () => { state.ui.calMonth = monthKey(new Date(y, m - 2, 1)); App.render(); };
    $('#calNext', el).onclick = () => { state.ui.calMonth = monthKey(new Date(y, m, 1)); App.render(); };
    $('#calToday', el).onclick = () => { state.ui.calMonth = monthKey(); App.render(); };
    $('#calFilter', el).onchange = e => { state.ui.calFilter = e.target.value; App.render(); };
    $('#calGen', el).onclick = () => planGenerator(y, m - 1);
    $('#calExport', el).onclick = () => {
      const rows = [['Data', 'Hora', 'Marca', 'Título', 'Formato', 'Pilar', 'Objetivo', 'Status', 'Legenda']];
      mp.sort((a, b) => a.date.localeCompare(b.date)).forEach(p => rows.push([p.date, p.time, BRANDS[p.brand]?.name || p.brand, p.title, p.format, p.pillar, p.objective, p.status, (p.caption || '').replace(/\n/g, ' ')]));
      download(`calendario-${mk}.csv`, '﻿' + rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n'), 'text/csv');
    };
    $$('.day', el).forEach(d => d.onclick = e => {
      const pid = e.target.closest('[data-post]')?.dataset.post;
      if (pid) editPost(DB.get('posts', pid)); else editPost({ date: d.dataset.day });
    });
  },
});

function planGenerator(y, m) {
  const b = genBrand();
  modal({
    title: `Gerar plano de conteúdo — ${MONTHS[m]} ${y}`, size: 'wide', saveLabel: 'Gerar posts',
    body: `<div class="tip mb">O gerador cria posts como <strong>Ideia</strong> nos dias escolhidos, alternando formatos, pilares e objetivos, e já inclui as datas fiscais do mês como pauta. Depois é só ajustar.</div>
      <div class="form-row">${F.select('brand', 'Marca', [['ordnas', 'ORDNAS'], ['vektra', 'VEKTRA'], ['ambas', 'As duas (gera para cada)']], b)}${F.time('time', 'Horário padrão', '12:00')}</div>
      <div class="field"><span>Dias da semana para postar no feed</span><div class="chips" id="wdChips">${WEEKDAYS.map((w, i) => `<span class="chip ${[1, 3, 5].includes(i) ? 'on' : ''}" data-wd="${i}">${w}</span>`).join('')}</div></div>
      <div class="field"><span>Formatos a alternar</span><div class="chips" id="fmChips">${['Reels', 'Carrossel', 'Post estático', 'Stories'].map(f => `<span class="chip ${['Reels', 'Carrossel'].includes(f) ? 'on' : ''}" data-fm="${f}">${f}</span>`).join('')}</div></div>
      ${F.check('fiscal', 'Incluir posts para datas fiscais e comemorativas do mês', true)}
      ${F.check('skip', 'Não criar em dias que já têm post', true)}`,
    onOpen: form => $$('.chip', form).forEach(c => c.onclick = () => c.classList.toggle('on')),
    onSave: (d, form) => {
      const wds = $$('#wdChips .chip.on', form).map(c => +c.dataset.wd);
      const fms = $$('#fmChips .chip.on', form).map(c => c.dataset.fm);
      if (!wds.length || !fms.length) { toast('Escolha dias e formatos'); return false; }
      const brands = d.brand === 'ambas' ? ['ordnas', 'vektra'] : [d.brand];
      const objCycle = ['alcance', 'autoridade', 'autoridade', 'conversao', 'relacionamento', 'engajamento'];
      let count = 0;
      brands.forEach(br => {
        const pil = (profile(br).pilares || 'Educação fiscal').split(',').map(s => s.trim()).filter(Boolean);
        const topics = shuffle(TOPICS);
        const existing = new Set(DB.raw('posts').filter(p => p.brand === br).map(p => p.date));
        let i = 0;
        const last = new Date(y, m + 1, 0).getDate();
        for (let day = 1; day <= last; day++) {
          const dt = new Date(y, m, day), k = ymd(dt);
          if (!wds.includes(dt.getDay()) || (d.skip && existing.has(k))) continue;
          const tp = topics[i % topics.length];
          DB.add('posts', { brand: br, date: k, time: d.time, title: tpl(tp.t, brandVars(br)), format: fms[i % fms.length], pillar: pil[i % pil.length], objective: objCycle[i % objCycle.length], status: 'ideia' });
          i++; count++;
        }
        if (d.fiscal) DATES.filter(x => x.m === m + 1).forEach(x => {
          const k = ymd(new Date(y, m, Math.max(1, x.d - 2)));
          DB.add('posts', { brand: br, date: k, time: d.time, title: x.pauta, format: 'Carrossel', pillar: pil[0], objective: 'autoridade', status: 'ideia', notes: 'Data: ' + x.t }); count++;
        });
      });
      App.render(); modal({ title: 'Plano do mês criado ✅', body: `<p><strong>${count} posts</strong> foram criados como <em>Ideia</em> em ${MONTHS[m]} ${y}.</p><p class="small muted">Clique em cada post no calendário para ajustar tema, roteiro e legenda, ou acompanhe em Produção.</p>`, extraBtns: `<a class="btn" href="#/production">Abrir Produção</a>` });
    },
  });
}

/* ---------- Produção (Kanban) ---------- */
view('production', {
  title: 'Produção de conteúdo', icon: 'kanban', sub: 'Do rascunho à publicação — arraste os cards',
  render(el) {
    const range = state.ui.prodRange || '30';
    const t = today();
    let posts = DB.all('posts');
    if (range !== 'all') posts = posts.filter(p => p.date >= addDays(t, -7) && p.date <= addDays(t, +range));
    posts.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    el.innerHTML = `<div class="row mb"><select id="prodRange" style="width:auto">
        <option value="14" ${range === '14' ? 'selected' : ''}>Próximos 14 dias</option><option value="30" ${range === '30' ? 'selected' : ''}>Próximos 30 dias</option><option value="all" ${range === 'all' ? 'selected' : ''}>Todos</option></select>
      <span class="muted small">${posts.length} post(s)</span><span class="sp"></span>
      <button class="btn primary" onclick="editPost({date:today()})">${ico('plus')}Novo post</button></div>
      <div class="kanban">${POST_STATUS.map(([k, l]) => { const ps = posts.filter(p => p.status === k); return `<div class="kcol" data-col="${k}"><div class="kcol-h"><span>${l}</span><span class="badge">${ps.length}</span></div>
        ${ps.map(p => `<div class="kcard" draggable="true" data-id="${p.id}"><div class="t">${esc(p.title)}</div><div class="row"><span class="badge" style="color:${FORMAT_COLORS[p.format]}">${esc(p.format)}</span><span class="badge ${p.date < t && k !== 'publicado' ? 'bad' : ''}">${fmt.date(p.date)}</span>${state.brand === 'all' ? brandBadge(p.brand) : ''}</div>
          <div class="row mt-s small muted">${p.script ? '📝 roteiro' : ''} ${p.caption ? '✍️ legenda' : ''} ${p.owner ? '👤 ' + esc(p.owner) : ''}</div></div>`).join('')}</div>`; }).join('')}</div>`;
    $('#prodRange', el).onchange = e => { state.ui.prodRange = e.target.value; save(); App.render(); };
    let dragId = null;
    $$('.kcard', el).forEach(c => {
      c.ondragstart = () => { dragId = c.dataset.id; };
      c.onclick = () => editPost(DB.get('posts', c.dataset.id));
    });
    $$('.kcol', el).forEach(col => {
      col.ondragover = e => { e.preventDefault(); col.classList.add('drag'); };
      col.ondragleave = () => col.classList.remove('drag');
      col.ondrop = e => { e.preventDefault(); if (dragId) { DB.update('posts', dragId, { status: col.dataset.col }); App.render(); } };
    });
  },
});

/* ---------- Banco de ideias ---------- */
function editIdea(i = {}) {
  const isNew = !i.id;
  modal({ title: isNew ? 'Nova ideia' : 'Editar ideia', saveLabel: isNew ? 'Adicionar ideia' : 'Salvar',
    body: `${F.text('title', 'Ideia', i.title, 'placeholder="Ex.: vídeo respondendo “MEI pode ter sócio?”"')}
      <div class="form-row">${F.select('format', 'Formato', FORMATS, i.format || 'Reels')}${F.select('prio', 'Prioridade', [['3', 'Alta'], ['2', 'Média'], ['1', 'Baixa']], String(i.prio || 2))}${F.select('pillar', 'Pilar', ['', ...allPillars()], i.pillar)}</div>
      ${F.brand(i.brand)}${F.area('notes', 'Observações / referência', i.notes, 3)}`,
    onSave: d => { if (!d.title.trim()) { toast('Escreva a ideia'); return false; } d.prio = +d.prio; if (isNew) DB.add('ideas', d); else DB.update('ideas', i.id, d); toast(isNew ? 'Ideia adicionada' : 'Ideia atualizada'); App.render(); },
    onDelete: isNew ? null : () => { DB.remove('ideas', i.id); App.render(); } });
}
function suggestIdeasModal() {
  const b = genBrand(), sug = shuffle(TOPICS).slice(0, 12).map(t => ({ ...t, t: tpl(t.t, brandVars(b)) }));
  modal({ title: 'Sugestões de ideias', size: 'wide', saveLabel: 'Adicionar selecionadas',
    body: `<p class="small muted" style="margin-top:0">Marque as ideias que quer guardar no banco.</p>${sug.map((t, k) => `<label class="chk" style="padding:7px 0;border-bottom:1px solid var(--line)"><input type="checkbox" name="s${k}" checked> <span><strong>${esc(t.t)}</strong> <span class="badge" style="color:${FORMAT_COLORS[t.f]}">${t.f}</span> <span class="badge">${esc(t.p)}</span></span></label>`).join('')}`,
    onSave: d => { let n = 0; sug.forEach((t, k) => { if (d['s' + k]) { DB.add('ideas', { title: t.t, format: t.f, prio: 2, pillar: t.p, brand: b }); n++; } }); toast(`${n} ideia(s) adicionada(s)`); App.render(); } });
}
view('ideas', {
  title: 'Banco de ideias', icon: 'lightbulb', sub: 'Capture tudo — nunca fique sem pauta',
  render(el) {
    const q = (state.ui.ideaQ || '').toLowerCase();
    const ideas = DB.all('ideas').filter(i => !q || (i.title + ' ' + (i.notes || '')).toLowerCase().includes(q)).sort((a, b) => (b.prio || 0) - (a.prio || 0));
    el.innerHTML = `<div class="row mb"><input id="ideaQ" placeholder="Buscar ideias…" value="${esc(state.ui.ideaQ || '')}" style="max-width:320px"><span class="muted small">${ideas.length} ideia(s)</span><span class="sp"></span>
      <button class="btn accent" id="ideaSuggest">${ico('sparkles')}Sugerir ideias</button><button class="btn primary" id="ideaNew">${ico('plus')}Nova ideia</button></div>
      <div class="grid g3">${ideas.map(i => `<div class="card"><div class="row"><span class="badge ${i.prio == 3 ? 'bad' : i.prio == 1 ? '' : 'warn'}">${i.prio == 3 ? 'Alta' : i.prio == 1 ? 'Baixa' : 'Média'}</span><span class="badge" style="color:${FORMAT_COLORS[i.format]}">${esc(i.format)}</span>${state.brand === 'all' ? brandBadge(i.brand) : ''}<span class="sp"></span><button class="icon-btn" style="width:28px;height:28px" data-edit="${i.id}" title="Editar">${ico('pencil')}</button></div>
        <div class="t mt-s" style="font-weight:600">${esc(i.title)}</div>${i.notes ? `<div class="muted small mt-s">${esc(i.notes)}</div>` : ''}
        <div class="row mt"><button class="btn xs" data-topost="${i.id}">${ico('calendar-plus')}Agendar</button><button class="btn xs" data-toscript="${i.id}">${ico('clapperboard')}Roteiro</button><button class="btn xs" data-tocap="${i.id}">${ico('type')}Legenda</button></div></div>`).join('') || `<div class="card" style="grid-column:1/-1">${emptyState('Nenhuma ideia ainda. Clique em “Nova ideia” ou “Sugerir ideias”.', 'lightbulb')}</div>`}</div>`;
    $('#ideaNew', el).onclick = () => editIdea();
    $('#ideaSuggest', el).onclick = suggestIdeasModal;
    $('#ideaQ', el).oninput = e => { state.ui.ideaQ = e.target.value; clearTimeout(window._iq); window._iq = setTimeout(() => { App.render(); const i = $('#ideaQ'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 300); };
    $$('[data-edit]', el).forEach(b => b.onclick = () => editIdea(DB.get('ideas', b.dataset.edit)));
    $$('[data-topost]', el).forEach(b => b.onclick = () => { const i = DB.get('ideas', b.dataset.topost); editPost({ title: i.title, format: i.format, brand: i.brand, pillar: i.pillar, notes: i.notes }); });
    $$('[data-toscript]', el).forEach(b => b.onclick = () => openScriptGenerator(DB.get('ideas', b.dataset.toscript).title));
    $$('[data-tocap]', el).forEach(b => b.onclick = () => openCaptionGenerator(DB.get('ideas', b.dataset.tocap).title));
  },
});

/* ---------- Datas fiscais e comemorativas ---------- */
view('dates', {
  title: 'Datas & prazos fiscais', icon: 'flag', sub: 'Obrigações e datas que viram conteúdo', isNew: true,
  render(el) {
    const y = new Date().getFullYear(), cm = new Date().getMonth() + 1;
    el.innerHTML = `<div class="tip warn mb">As datas fiscais seguem o padrão habitual da Receita Federal. Confirme os prazos oficiais de cada ano antes de publicar — a Receita pode alterar datas (ex.: IRPF).</div>
      <div class="card mb"><h3>${ico('repeat')}Todo mês</h3><div class="list">${MONTHLY_DATES.map(d => `<div class="li"><strong style="width:60px">Dia ${d.d}</strong><div class="grow">${esc(d.t)}<div class="muted small">💡 ${esc(d.pauta)}</div></div></div>`).join('')}</div></div>
      <div class="grid g2">${MONTHS.map((mn, i) => { const ds = DATES.filter(d => d.m === i + 1); return `<div class="card" style="${i + 1 === cm ? 'border-color:var(--brand)' : ''}"><h3>${ico('calendar')}${mn} ${i + 1 === cm ? '<span class="badge info">mês atual</span>' : ''}</h3><div class="list">${ds.map(d => { const yy = (i + 1 < cm) ? y + 1 : y; return `<div class="li"><strong style="width:34px">${d.d}</strong><div class="grow"><div class="small">${esc(d.t)} <span class="badge ${d.tipo === 'fiscal' ? 'warn' : d.tipo === 'institucional' ? 'info' : 'ok'}">${d.tipo}</span></div><div class="muted small">💡 ${esc(d.pauta)}</div></div><button class="btn xs" data-add="${yy}-${i + 1}-${d.d}" data-t="${esc(d.pauta)}" data-n="${esc(d.t)}">${ico('calendar-plus')}</button></div>`; }).join('') || '<div class="muted small">—</div>'}</div></div>`; }).join('')}</div>`;
    $$('[data-add]', el).forEach(b => b.onclick = () => { const [yy, mm, dd] = b.dataset.add.split('-').map(Number); editPost({ date: addDays(ymd(new Date(yy, mm - 1, dd)), -2), title: b.dataset.t, format: 'Carrossel', objective: 'autoridade', notes: 'Data: ' + b.dataset.n }); });
  },
});
