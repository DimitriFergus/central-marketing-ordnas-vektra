/* ===== Conteúdo: roteiros, legendas, bio e prompts ===== */

/* ---------- IA integrada (opcional): Claude via SDK oficial ---------- */
async function aiGenerate(prompt, system) {
  const s = state.settings || {};
  if (!s.aiKey) throw new Error('Configure sua chave da API em Marca & IA → Integrações.');
  const { default: Anthropic } = await import('https://esm.sh/@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: s.aiKey, dangerouslyAllowBrowser: true });
  const msg = await client.beta.messages.create({
    model: s.aiModel || 'claude-opus-5-5',
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: s.aiEffort || 'low' },
    system: system || 'Você é um estrategista de marketing sênior especializado em escritórios de contabilidade no Brasil. Escreva em português do Brasil, linguagem clara, sem juridiquês, pronta para publicar. Não invente números de clientes reais; use colchetes para dados que o usuário deve preencher.',
    messages: [{ role: 'user', content: prompt }],
  });
  if (msg.stop_reason === 'refusal') throw new Error('O pedido foi recusado pela IA. Reformule o texto.');
  return msg.content.filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
}
function hasAI() { return !!(state.settings || {}).aiKey; }
/* Botões "Gerar com IA" + "Abrir no ChatGPT/Claude" para um prompt */
function aiButtons(id) {
  return `<button type="button" class="btn sm primary" data-ai="${id}">${ico('sparkles')}${hasAI() ? 'Gerar com IA' : 'Gerar com IA (configurar)'}</button>
    <button type="button" class="btn sm" data-open="claude" data-for="${id}">${ico('external-link')}Abrir no Claude</button>
    <button type="button" class="btn sm" data-open="chatgpt" data-for="${id}">${ico('external-link')}Abrir no ChatGPT</button>`;
}
/* Janela para configurar a chave da IA sem sair da tela */
function aiSetupModal(then) {
  const s = state.settings ||= {};
  modal({ title: 'Ativar IA integrada (Claude)', saveLabel: 'Salvar e continuar',
    body: `<p class="small">Cole sua chave da API da Anthropic para gerar textos completos direto aqui. Crie a chave em <a href="https://console.anthropic.com/settings/keys" target="_blank">console.anthropic.com</a>. A chave fica salva só neste navegador.</p>
      ${F.text('aiKey', 'Chave da API (sk-ant-…)', s.aiKey || '', 'type="password"')}
      <div class="tip small">Sem chave? Feche esta janela e use os botões <strong>Abrir no Claude</strong> ou <strong>Abrir no ChatGPT</strong>: o prompt vai pronto.</div>`,
    onSave: d => { if (!d.aiKey.trim()) { toast('Cole a chave'); return false; } s.aiKey = d.aiKey.trim(); save(); toast('IA ativada'); if (then) setTimeout(then, 50); } });
}
/* Janela de "gerando…" enquanto a IA escreve */
async function runAI(prompt, title, onUse, useLabel) {
  if (!hasAI()) { aiSetupModal(() => runAI(prompt, title, onUse, useLabel)); return; }
  const wait = modal({ title: title || 'Gerando com IA', body: `<div class="empty">${ico('loader')}A IA está escrevendo… isso leva de 10 a 40 segundos.</div>` });
  try {
    const t = await aiGenerate(prompt);
    wait.close();
    textModal(title || 'Resultado da IA', t, { use: onUse, useLabel, save: x => { promptBox('Salvar texto', 'Nome', title || 'Texto da IA', n => { DB.add('captions', { brand: genBrand(), title: n, text: x }); toast('Salvo em Legendas → Minhas legendas'); }); } });
  } catch (e) {
    wait.close(); console.error(e);
    modal({ title: 'Não foi possível gerar', body: `<div class="tip warn">${esc(e.message)}</div><p class="small muted">Confira a chave em Marca & IA → Integrações ou use os botões Abrir no Claude / ChatGPT.</p>` });
  }
}
function wireAI(root, getPrompt, onUse, useLabel) {
  $$('[data-ai]', root).forEach(b => b.onclick = () => runAI(getPrompt(b.dataset.ai), 'Resultado da IA', onUse ? t => onUse(t, b.dataset.ai) : null, useLabel));
  $$('[data-open]', root).forEach(b => b.onclick = () => {
    const p = encodeURIComponent(getPrompt(b.dataset.for));
    window.open(b.dataset.open === 'claude' ? `https://claude.ai/new?q=${p}` : `https://chatgpt.com/?q=${p}`, '_blank');
  });
}

function temaVars(tema, brand, objetivo = 'autoridade') {
  const v = brandVars(brand);
  const t = (tema || 'contabilidade da sua empresa').trim();
  const curto = t.split(/[:?!—(]| - | x /i)[0].trim().split(' ').slice(0, 6).join(' ');
  return {
    ...v, tema: t, tema_lower: t.charAt(0).toLowerCase() + t.slice(1), tema_curto: curto.toLowerCase(),
    dor: (v.dores || '').split(',')[0].trim().toLowerCase() || 'paga imposto demais',
    publico_curto: (v.publico || '').split(',')[0].trim().toLowerCase(),
    cta: tpl(pick(CTAS[objetivo] || CTAS.autoridade), v),
  };
}

/* ---------- Roteiros ---------- */
function buildScript({ tema, estrutura = 'gcc', formato = 'reels60', brand, objetivo = 'autoridade', hook }) {
  const v = temaVars(tema, brand, objetivo);
  const hooks = shuffle(HOOKS).slice(0, 3).map(h => tpl(h, v));
  v.hook = hook || hooks[0];
  const st = SCRIPT_STRUCTURES[estrutura] || SCRIPT_STRUCTURES.gcc;
  const parts = st.parts.map(([t, x]) => [t, tpl(x, v)]);
  let text;
  if (formato === 'carrossel') {
    text = parts.map(([t, x], i) => `SLIDE ${i + 1} — ${t}\n${x}`).join('\n\n') + `\n\nSLIDE ${parts.length + 1} — FINAL\nSalve este post 📌 e siga ${v.handle}`;
  } else if (formato === 'stories') {
    const stk = ['Enquete: "Você sabia disso?" Sim/Não', 'Caixinha de perguntas', 'Quiz com 3 opções', 'Slider de emoji 😱', 'Link para o WhatsApp'];
    text = parts.map(([t, x], i) => `STORY ${i + 1} — ${t}\n${x}\n[Sticker sugerido: ${stk[i % stk.length]}]`).join('\n\n');
  } else {
    text = parts.map(([t, x]) => `【${t}】\n${x}`).join('\n\n');
  }
  return { text, hooks, tips: SCRIPT_FORMATS[formato]?.tips || '', name: st.name };
}
function scriptPrompt(d) {
  const v = temaVars(d.tema, d.brand, d.objetivo);
  return `Escreva um roteiro de ${SCRIPT_FORMATS[d.formato].name} para o Instagram da ${v.marca}.\nTema: "${v.tema}".\nEstrutura: ${SCRIPT_STRUCTURES[d.estrutura].name}.\nObjetivo: ${d.objetivo}.\nPúblico: ${v.publico}.\nTom de voz: ${v.tom}.\nDiferenciais: ${v.diferenciais}.\nTraga: 5 opções de gancho para os 3 primeiros segundos, o roteiro completo com falas, indicação de texto na tela e cortes, e um CTA final. Dicas do formato: ${SCRIPT_FORMATS[d.formato].tips}`;
}

view('scripts', {
  title: 'Roteiros', icon: 'clapperboard', sub: 'Reels, carrosséis, stories e lives — com teleprompter',
  render(el) {
    const tb = tabs('scrTab', [['gen', 'Gerador de roteiro'], ['saved', `Meus roteiros (${DB.all('scripts').length})`]]);
    el.innerHTML = tb.html + '<div id="scrBody"></div>';
    const body = $('#scrBody', el);
    if (tb.cur === 'saved') return renderSavedScripts(body);
    const pre = state.ui.prefill || ''; state.ui.prefill = '';
    const last = state.ui.lastScript || { tema: pre, estrutura: 'gcc', formato: 'reels60', objetivo: 'autoridade' };
    if (pre) last.tema = pre;
    body.innerHTML = `<div class="grid g-side-l">
      <div class="card" style="align-self:start"><h3>${ico('settings-2')}Configuração</h3><form id="scrForm">${scriptFormFields(last)}
        <button class="btn primary" style="width:100%;justify-content:center">${ico('wand-2')}Gerar roteiro</button></form>
        <div class="tip mt small"><strong>Dica de analista:</strong> grave 4-6 roteiros no mesmo dia (batch). Use o teleprompter no celular ou notebook.</div></div>
      <div class="card" style="align-self:start"><h3>${ico('history')}Roteiros recentes</h3>${DB.all('scripts').slice(-6).reverse().map(s => `<div class="li" style="cursor:pointer" data-rs="${s.id}"><span class="badge">${esc(SCRIPT_FORMATS[s.formato]?.name || '')}</span><div class="grow t small">${esc(s.title)}</div>${ico('chevron-right')}</div>`).join('') || emptyState('Escolha um tema e clique em “Gerar roteiro”. O roteiro abre numa janela onde você troca o gancho, edita, salva e abre no teleprompter.', 'clapperboard')}</div></div>`;
    wireScriptForm(body);
    $('#scrForm', body).onsubmit = e => { e.preventDefault(); const d = formData(e.target); d.brand = genBrand(); state.ui.lastScript = d; save(); scriptModal(d); };
    $$('[data-rs]', body).forEach(r => r.onclick = () => openSavedScript(r.dataset.rs));
  },
});
function scriptFormFields(last) {
  return `${genBrandPicker()}
    <label class="field"><span>Tema do conteúdo</span><input name="tema" list="topicList" value="${esc(last.tema || '')}" placeholder="Ex.: Pró-labore x distribuição de lucros"></label>
    <datalist id="topicList">${TOPICS.map(t => `<option value="${esc(t.t)}">`).join('')}</datalist>
    <button type="button" class="btn xs mb" data-rnd>${ico('shuffle')}Tema aleatório</button>
    ${F.select('formato', 'Formato', Object.entries(SCRIPT_FORMATS).map(([k, v]) => [k, v.name]), last.formato || 'reels60')}
    ${F.select('estrutura', 'Estrutura / técnica', Object.entries(SCRIPT_STRUCTURES).map(([k, v]) => [k, v.name]), last.estrutura || 'gcc')}
    ${F.select('objetivo', 'Objetivo', OBJECTIVES, last.objetivo || 'autoridade')}`;
}
function wireScriptForm(root) { const r = $('[data-rnd]', root); if (r) r.onclick = () => { $('[name=tema]', root).value = tpl(pick(TOPICS).t, brandVars(genBrand())); }; }
/* Janela rápida para criar roteiro de qualquer tela */
function openScriptGenerator(tema) {
  const last = { ...(state.ui.lastScript || {}), tema: tema || '' };
  modal({ title: 'Criar roteiro', saveLabel: 'Gerar roteiro', body: scriptFormFields(last),
    onOpen: f => wireScriptForm(f),
    onSave: d => { if (!d.tema.trim()) { toast('Informe o tema'); return false; } d.brand = genBrand(); state.ui.lastScript = d; save(); setTimeout(() => scriptModal(d), 30); } });
}
/* Janela com o roteiro gerado */
function scriptModal(d, hook) {
  if (!d.tema || !d.tema.trim()) { toast('Informe o tema do roteiro'); return; }
  const r = buildScript({ ...d, hook });
  const m = modal({ title: 'Roteiro: ' + d.tema, size: 'xl',
    body: `<div class="row mb"><span class="badge">${esc(r.name)}</span><span class="badge">${esc(SCRIPT_FORMATS[d.formato].name)}</span></div>
      <div class="field"><span>Escolha o gancho (clique para trocar)</span><div class="chips">${r.hooks.map(h => `<span class="chip ${h === hook ? 'on' : ''}" data-hook="${esc(h)}">${esc(h)}</span>`).join('')}</div></div>
      <textarea id="scrText" rows="16">${esc(r.text)}</textarea>
      <div class="tip mt-s small">🎬 <strong>${esc(SCRIPT_FORMATS[d.formato].name)}:</strong> ${esc(r.tips)}</div>
      <hr><div class="small muted mb">Quer o roteiro 100% escrito, com falas completas? Use a IA com todo o contexto da marca:</div><div class="row">${aiButtons('scr')}</div>`,
    extraBtns: `<button type="button" class="btn" id="scrPrompter">${ico('monitor-play')}Teleprompter</button><button type="button" class="btn" id="scrCopy">${ico('copy')}Copiar</button><button type="button" class="btn" id="scrPost">${ico('calendar-plus')}Agendar post</button>`,
    saveLabel: 'Salvar roteiro',
    onSave: (x, f) => { saveScriptModal(d, $('#scrText', f).value); return false; } });
  const w = m.el, txt = () => $('#scrText', w).value;
  $$('[data-hook]', w).forEach(c => c.onclick = () => { m.close(); scriptModal(d, c.dataset.hook); });
  $('#scrPrompter', w).onclick = () => teleprompter(txt());
  $('#scrCopy', w).onclick = () => copy(txt());
  $('#scrPost', w).onclick = () => editPost({ title: d.tema, brand: d.brand, script: txt(), format: d.formato === 'carrossel' ? 'Carrossel' : d.formato === 'stories' ? 'Stories' : d.formato === 'live' ? 'Live' : 'Reels', objective: d.objetivo, status: 'roteiro' });
  wireAI(w, () => scriptPrompt(d), t => { $('#scrText', w).value = t; toast('Roteiro da IA aplicado'); }, 'Usar no roteiro');
}
function saveScriptModal(d, text) {
  modal({ title: 'Salvar roteiro', saveLabel: 'Salvar',
    body: `${F.text('title', 'Nome do roteiro', d.tema)}${F.select('status', 'Status', [['rascunho', 'Rascunho'], ['gravado', 'Já gravado']], 'rascunho')}${F.check('topost', 'Também criar um post no calendário', false)}${F.date('date', 'Data do post (se marcado acima)', today())}`,
    onSave: x => { DB.add('scripts', { brand: d.brand, title: x.title || d.tema, formato: d.formato, estrutura: d.estrutura, text, status: x.status });
      if (x.topost) DB.add('posts', { brand: d.brand, title: x.title || d.tema, date: x.date, time: '12:00', script: text, format: d.formato === 'carrossel' ? 'Carrossel' : d.formato === 'stories' ? 'Stories' : 'Reels', objective: d.objetivo, status: 'roteiro' });
      toast(x.topost ? 'Roteiro salvo e post criado no calendário' : 'Roteiro salvo em “Meus roteiros”'); if (App.current === 'scripts') setTimeout(() => App.render(), 10); } });
}
function renderSavedScripts(body) {
  const list = DB.all('scripts').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  body.innerHTML = list.length ? `<div class="grid g3">${list.map(s => `<div class="card"><div class="row"><span class="badge">${esc(SCRIPT_FORMATS[s.formato]?.name || s.formato)}</span>${state.brand === 'all' ? brandBadge(s.brand) : ''}<span class="badge ${s.status === 'gravado' ? 'ok' : ''}">${s.status === 'gravado' ? 'Gravado' : 'Rascunho'}</span></div>
    <div class="t mt-s" style="font-weight:700">${esc(s.title)}</div><div class="muted small mt-s" style="max-height:60px;overflow:hidden">${esc(s.text.slice(0, 160))}…</div>
    <div class="row mt"><button class="btn xs" data-open-s="${s.id}">${ico('pencil')}Abrir</button><button class="btn xs" data-tp="${s.id}">${ico('monitor-play')}Teleprompter</button><button class="btn xs" data-done="${s.id}">${ico('check')}${s.status === 'gravado' ? 'Desmarcar' : 'Gravado'}</button></div></div>`).join('')}</div>`
    : `<div class="card">${emptyState('Nenhum roteiro salvo ainda.', 'clapperboard')}</div>`;
  $$('[data-tp]', body).forEach(b => b.onclick = () => teleprompter(DB.get('scripts', b.dataset.tp).text));
  $$('[data-done]', body).forEach(b => b.onclick = () => { const s = DB.get('scripts', b.dataset.done); DB.update('scripts', s.id, { status: s.status === 'gravado' ? 'rascunho' : 'gravado' }); App.render(); });
  $$('[data-open-s]', body).forEach(b => b.onclick = () => openSavedScript(b.dataset.openS));
}
function openSavedScript(id) {
  const s = DB.get('scripts', id);
  modal({ title: s.title, size: 'wide', body: F.text('title', 'Título', s.title) + F.select('status', 'Status', [['rascunho', 'Rascunho'], ['gravado', 'Gravado']], s.status) + F.area('text', 'Roteiro', s.text, 16),
    onSave: d => { DB.update('scripts', s.id, d); toast('Roteiro atualizado'); App.render(); }, onDelete: () => { DB.remove('scripts', s.id); App.render(); },
    extraBtns: `<button type="button" class="btn" data-mtp>${ico('monitor-play')}Teleprompter</button>`,
    onOpen: (f, w) => { $('[data-mtp]', w).onclick = () => teleprompter($('[name=text]', f).value); } });
}

/* Teleprompter em tela cheia */
function teleprompter(text) {
  const clean = text.replace(/【[^】]*】|\[Sticker[^\]]*\]/g, '').replace(/\n{3,}/g, '\n\n').trim();
  const w = document.createElement('div'); w.className = 'prompter';
  w.innerHTML = `<div class="prompter-bar"><button class="btn" id="tpPlay">▶ Iniciar</button><button class="btn" id="tpReset">⟲ Início</button>
    <label>Velocidade <input type="range" id="tpSpeed" min="1" max="12" value="4"></label><label>Fonte <input type="range" id="tpSize" min="24" max="90" value="44"></label>
    <label><input type="checkbox" id="tpMirror"> Espelhar</label><span class="sp"></span><span style="color:#888;font-size:12px">Espaço = play/pause · Esc = sair</span><button class="btn" id="tpClose">✕ Fechar</button></div>
    <div class="prompter-text" id="tpText">${esc(clean)}</div>`;
  document.body.appendChild(w);
  const tx = $('#tpText', w); let playing = false, raf, acc = 0;
  const step = () => { if (!playing) return; acc += +$('#tpSpeed', w).value * 0.35; if (acc >= 1) { tx.scrollTop += Math.floor(acc); acc -= Math.floor(acc); } raf = requestAnimationFrame(step); };
  const toggle = () => { playing = !playing; $('#tpPlay', w).textContent = playing ? '❚❚ Pausar' : '▶ Iniciar'; if (playing) step(); else cancelAnimationFrame(raf); };
  const close = () => { playing = false; cancelAnimationFrame(raf); w.remove(); document.removeEventListener('keydown', key); };
  const key = e => { if (e.key === 'Escape') close(); if (e.key === ' ') { e.preventDefault(); toggle(); } };
  document.addEventListener('keydown', key);
  $('#tpPlay', w).onclick = toggle; $('#tpClose', w).onclick = close;
  $('#tpReset', w).onclick = () => { tx.scrollTop = 0; };
  $('#tpSize', w).oninput = e => { tx.style.fontSize = e.target.value + 'px'; };
  $('#tpMirror', w).onchange = e => tx.classList.toggle('mirror', e.target.checked);
}

/* ---------- Legendas ---------- */
function buildCaptions({ tema, objetivo = 'autoridade', brand, tamanho = 'media', emojis = true, tags = [], local = true }) {
  const v = temaVars(tema, brand, objetivo);
  const E = s => emojis ? s : '';
  const ctas = shuffle(CTAS[objetivo] || CTAS.autoridade).map(c => tpl(c, v));
  const openers = [
    `${E('📌 ')}${v.tema}`,
    `${E('⚠️ ')}Atenção, ${v.publico_curto}: ${v.tema_lower}`,
    `Você sabe mesmo como funciona ${v.tema_curto}? ${E('👇')}`,
    `${E('💡 ')}O que ninguém te conta sobre ${v.tema_curto}`,
    `${E('🚨 ')}${tpl(pick(HOOKS), v)}`,
  ];
  const bodies = {
    curta: [`Resumo rápido: [explique em 1 frase a ideia principal].\n\nNa ${v.marca}, a gente resolve isso para você.`],
    media: [
      `Muita empresa erra aqui e acaba pagando caro por isso.\n\n${E('✅ ')}[Ponto 1 — o conceito em linguagem simples]\n${E('✅ ')}[Ponto 2 — o erro mais comum]\n${E('✅ ')}[Ponto 3 — o que fazer agora]\n\nContabilidade não é só emitir guia: é estratégia para sua empresa crescer com segurança.`,
      `Se você é ${v.publico_curto}, precisa entender isso:\n\n${E('1️⃣ ')}[O que é]\n${E('2️⃣ ')}[Quando se aplica]\n${E('3️⃣ ')}[Quanto pode economizar ou evitar de multa]\n\nNa ${v.marca}, ${v.diferenciais.split(',')[0].toLowerCase()}.`,
    ],
    longa: [
      `Esta semana atendemos um empresário com exatamente essa dúvida — e ela é mais comum do que parece.\n\n${E('👉 ')}O problema: [descreva a situação]\n${E('👉 ')}O risco: [multa / imposto a mais / problema com a Receita]\n${E('👉 ')}A solução: [o que fizemos, passo a passo]\n\nO resultado? [resultado concreto: economia, regularização, tranquilidade].\n\nPor isso dizemos: contador bom é aquele que pensa no seu negócio antes de você precisar pedir.\n\nAqui na ${v.marca} nosso diferencial é ${v.diferenciais.toLowerCase()}.`,
    ],
  };
  const hashtags = tags.map(t => HASHTAGS[t]).join(' ') + (local && profile(brand).city ? ` #contador${profile(brand).city.toLowerCase().replace(/\s+/g, '')} #contabilidade${profile(brand).city.toLowerCase().replace(/\s+/g, '')}` : '');
  const kw = local && profile(brand).city ? `\n\n${E('📍 ')}Contabilidade em ${profile(brand).city}` : '';
  return shuffle(openers).slice(0, 3).map((op, i) => {
    const b = bodies[tamanho][i % bodies[tamanho].length];
    return `${op}\n\n${b}${kw}\n\n${E('👉 ')}${ctas[i % ctas.length]}\n\n${hashtags.trim()}`.trim();
  });
}
function captionPrompt(d) {
  const v = temaVars(d.tema, d.brand, d.objetivo);
  return `Escreva 3 versões de legenda para Instagram da ${v.marca} (${v.handle}) sobre: "${v.tema}".\nObjetivo do post: ${d.objetivo}. Tamanho: ${d.tamanho}. ${d.emojis ? 'Use emojis com moderação.' : 'Não use emojis.'}\nPúblico: ${v.publico}. Tom: ${v.tom}. Diferenciais: ${v.diferenciais}. Cidade: ${v.cidade}.\nRegras: primeira linha que prenda (até 125 caracteres, aparece antes do "mais"), corpo escaneável, conteúdo tecnicamente correto sobre contabilidade brasileira, CTA claro e 8 hashtags relevantes no final. Inclua palavras-chave para a busca do Instagram.`;
}
function bioOptions(b) {
  const p = profile(b), city = p.city ? ` em ${p.city}` : '';
  const srv = p.servicos.split(',').slice(0, 3).map(s => s.trim());
  return [
    `📊 Contabilidade${city} para ${p.publico.split(',')[0].toLowerCase()}\n✅ ${srv.join(' · ')}\n⚡ ${p.diferenciais.split(',')[0]}\n👇 Fale com um especialista`,
    `${p.name}\nSua empresa em dia e pagando o imposto certo.\n📍 Atendimento${city || ' online'} e em todo o Brasil\n💬 Diagnóstico gratuito no link 👇`,
    `Contador que fala a sua língua 🤝\n${srv[0]} | ${srv[1] || ''} | ${srv[2] || ''}\n+ empresas crescendo com segurança\n📲 Chame no WhatsApp`,
  ];
}

view('captions', {
  title: 'Legendas para Instagram', icon: 'type', sub: 'Gerador de legendas, bio, CTAs e hashtags',
  render(el) {
    const tb = tabs('capTab', [['gen', 'Gerador de legendas'], ['saved', `Minhas legendas (${DB.all('captions').length})`], ['bio', 'Bio do perfil'], ['bank', 'CTAs & hashtags']]);
    el.innerHTML = tb.html + '<div id="capBody"></div>';
    const body = $('#capBody', el);
    if (tb.cur === 'saved') {
      const list = DB.all('captions').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      body.innerHTML = `<div class="row mb"><span class="sp"></span><button class="btn primary" id="capNewManual">${ico('plus')}Nova legenda</button></div>` + (list.length ? `<div class="grid g2">${list.map(c => `<div class="card"><div class="row"><strong>${esc(c.title)}</strong>${state.brand === 'all' ? brandBadge(c.brand) : ''}<span class="sp"></span><span class="muted small">${c.text.length} caracteres</span></div><div class="out mt-s" style="max-height:160px;overflow:hidden">${esc(c.text)}</div><div class="row mt-s"><button class="btn xs" data-ed="${c.id}">${ico('pencil')}Abrir</button><button class="btn xs" data-cp="${c.id}">${ico('copy')}Copiar</button><button class="btn xs" data-use="${c.id}">${ico('calendar-plus')}Usar em post</button></div></div>`).join('')}</div>` : `<div class="card">${emptyState('Nenhuma legenda salva.', 'type')}</div>`);
      const editCap = (c = {}) => modal({ title: c.id ? 'Editar legenda' : 'Nova legenda', size: 'wide', body: `${F.text('title', 'Título', c.title)}${F.brand(c.brand)}${F.area('text', 'Legenda', c.text, 12)}`,
        onSave: d => { if (!d.text.trim()) { toast('Escreva a legenda'); return false; } if (c.id) DB.update('captions', c.id, d); else DB.add('captions', d); toast('Legenda salva'); App.render(); },
        onDelete: c.id ? () => { DB.remove('captions', c.id); App.render(); } : null });
      $('#capNewManual', body).onclick = () => editCap();
      $$('[data-ed]', body).forEach(b => b.onclick = () => editCap(DB.get('captions', b.dataset.ed)));
      $$('[data-cp]', body).forEach(b => b.onclick = () => copy(DB.get('captions', b.dataset.cp).text));
      $$('[data-use]', body).forEach(b => b.onclick = () => { const c = DB.get('captions', b.dataset.use); editPost({ title: c.title, caption: c.text, brand: c.brand }); });
      return;
    }
    if (tb.cur === 'bio') {
      body.innerHTML = `<div class="card" style="max-width:640px">${genBrandPicker()}<p class="small muted">A bio usa os dados de <a href="#/brand">Marca & IA</a>. Limite do Instagram: 150 caracteres.</p><button class="btn primary" id="bioGen">${ico('wand-2')}Gerar opções de bio</button>
        <div class="tip mt small"><strong>Checklist de bio que converte:</strong><br>✔ Quem você ajuda<br>✔ Como ajuda (serviço)<br>✔ Prova/diferencial<br>✔ Localização (busca local)<br>✔ CTA + link (WhatsApp ou página)</div></div>`;
      $('#bioGen', body).onclick = () => bioModal(genBrand());
      return;
    }
    if (tb.cur === 'bank') {
      const v = brandVars(genBrand());
      body.innerHTML = `<div class="grid g2"><div class="card"><h3>${ico('mouse-pointer-click')}Banco de CTAs</h3>${Object.entries(CTAS).map(([k, arr]) => `<h4 class="small muted mt">${OBJECTIVES.find(o => o[0] === k)[1]}</h4>${arr.map(c => `<div class="li"><div class="grow small">${esc(tpl(c, v))}</div><button class="btn xs" data-copy="${esc(tpl(c, v))}">${ico('copy')}</button></div>`).join('')}`).join('')}</div>
        <div class="card"><h3>${ico('hash')}Grupos de hashtags</h3>${Object.entries(HASHTAGS).map(([k, h]) => `<div class="li"><div class="grow"><div class="t small">${k}</div><div class="muted small">${h}</div></div><button class="btn xs" data-copy="${h}">${ico('copy')}</button></div>`).join('')}
        <div class="tip mt small">Use de 5 a 10 hashtags bem relacionadas. Hashtags locais (#contadorsuacidade) ajudam a aparecer para quem está perto.</div></div></div>`;
      $$('[data-copy]', body).forEach(x => x.onclick = () => copy(x.dataset.copy));
      return;
    }
    const pre = state.ui.prefill || ''; state.ui.prefill = '';
    const last = { ...(state.ui.lastCap || {}) }; if (pre) last.tema = pre;
    body.innerHTML = `<div class="grid g-side-l"><div class="card" style="align-self:start"><form id="capForm">${captionFormFields(last)}
      <button class="btn primary mt" style="width:100%;justify-content:center">${ico('wand-2')}Gerar 3 legendas</button></form></div>
      <div class="card" style="align-self:start"><h3>${ico('history')}Legendas recentes</h3>${DB.all('captions').slice(-6).reverse().map(c => `<div class="li"><div class="grow"><div class="t small">${esc(c.title)}</div><div class="muted small">${esc(c.text.slice(0, 90))}…</div></div><button class="btn xs" data-cp="${c.id}">${ico('copy')}</button></div>`).join('') || emptyState('Defina o tema e clique em “Gerar 3 legendas”. As variações abrem numa janela para você editar, copiar, salvar ou usar num post.', 'type')}</div></div>`;
    wireCaptionForm(body);
    $$('[data-cp]', body).forEach(b => b.onclick = () => copy(DB.get('captions', b.dataset.cp).text));
    $('#capForm', body).onsubmit = e => { e.preventDefault(); const d = readCaptionForm(e.target); captionModal(d); };
  },
});
function captionFormFields(last) {
  const tags = last.tags || ['Contabilidade', 'Empreendedorismo'];
  return `${genBrandPicker()}<label class="field"><span>Tema do post</span><input name="tema" list="topicList2" value="${esc(last.tema || '')}" placeholder="Ex.: Fator R para prestadores de serviço"></label><datalist id="topicList2">${TOPICS.map(t => `<option value="${esc(t.t)}">`).join('')}</datalist>
    ${F.select('objetivo', 'Objetivo', OBJECTIVES, last.objetivo || 'autoridade')}${F.select('tamanho', 'Tamanho', [['curta', 'Curta'], ['media', 'Média'], ['longa', 'Longa (storytelling)']], last.tamanho || 'media')}
    <div class="field"><span>Hashtags</span><div class="chips" data-tagchips>${Object.keys(HASHTAGS).map(k => `<span class="chip ${tags.includes(k) ? 'on' : ''}" data-tag="${k}">${k}</span>`).join('')}</div></div>
    ${F.check('emojis', 'Usar emojis', last.emojis ?? true)}${F.check('local', 'Incluir palavras-chave locais (cidade)', last.local ?? true)}`;
}
function wireCaptionForm(root) { $$('[data-tagchips] .chip', root).forEach(c => c.onclick = () => c.classList.toggle('on')); }
function readCaptionForm(root) { const d = formData(root); d.brand = genBrand(); d.tags = $$('[data-tagchips] .chip.on', root).map(c => c.dataset.tag); state.ui.lastCap = d; save(); return d; }
/* Janela rápida para criar legenda de qualquer tela */
function openCaptionGenerator(tema) {
  modal({ title: 'Criar legenda', saveLabel: 'Gerar 3 legendas', body: captionFormFields({ ...(state.ui.lastCap || {}), tema: tema || '' }),
    onOpen: f => wireCaptionForm(f),
    onSave: (x, f) => { const d = readCaptionForm(f); if (!d.tema.trim()) { toast('Informe o tema'); return false; } setTimeout(() => captionModal(d), 30); } });
}
/* Janela com as 3 legendas geradas */
function captionModal(d) {
  if (!d.tema || !d.tema.trim()) { toast('Informe o tema do post'); return; }
  const caps = buildCaptions(d);
  const m = modal({ title: 'Legendas: ' + d.tema, size: 'xl',
    body: `<p class="small muted" style="margin-top:0">Os trechos entre [colchetes] são para você completar — ou use a IA para receber o texto pronto.</p><div class="grid g3">${caps.map((c, i) => `<div class="out"><h4>Variação ${i + 1}</h4><textarea rows="14" data-cap="${i}">${esc(c)}</textarea>
      <div class="out-actions"><span class="badge" data-cnt="${i}">${c.length}/2200</span><button class="btn xs" data-c="${i}">${ico('copy')}Copiar</button><button class="btn xs" data-s="${i}">${ico('save')}Salvar</button><button class="btn xs" data-p="${i}">${ico('calendar-plus')}Usar em post</button></div></div>`).join('')}</div>
      <hr><div class="row">${aiButtons('cap')}</div>`,
    extraBtns: `<button type="button" class="btn" data-regen>${ico('refresh-cw')}Gerar outras</button>` });
  const w = m.el, val = i => $(`[data-cap="${i}"]`, w).value;
  $$('[data-cap]', w).forEach(t => t.oninput = () => { $(`[data-cnt="${t.dataset.cap}"]`, w).textContent = t.value.length + '/2200'; });
  $$('[data-c]', w).forEach(b => b.onclick = () => copy(val(b.dataset.c)));
  $$('[data-s]', w).forEach(b => b.onclick = () => promptBox('Salvar legenda', 'Nome da legenda', d.tema, n => { DB.add('captions', { brand: d.brand, title: n, text: val(b.dataset.s), objetivo: d.objetivo }); toast('Legenda salva em “Minhas legendas”'); }, { saveLabel: 'Salvar' }));
  $$('[data-p]', w).forEach(b => b.onclick = () => editPost({ title: d.tema, caption: val(b.dataset.p), brand: d.brand, objective: d.objetivo }));
  $('[data-regen]', w).onclick = () => { m.close(); captionModal(d); };
  wireAI(w, () => captionPrompt(d));
}
function bioModal(b) {
  const m = modal({ title: 'Opções de bio — ' + profile(b).name, size: 'wide',
    body: bioOptions(b).map(x => `<div class="out"><div>${esc(x)}</div><div class="out-actions"><span class="badge ${x.length > 150 ? 'bad' : 'ok'}">${x.length}/150</span><button class="btn xs" data-copy="${esc(x)}">${ico('copy')}Copiar</button></div></div>`).join('') + `<hr><div class="row">${aiButtons('bio')}</div>`,
    extraBtns: `<button type="button" class="btn" data-regen>${ico('refresh-cw')}Gerar outras</button>` });
  $$('[data-copy]', m.el).forEach(x => x.onclick = () => copy(x.dataset.copy));
  $('[data-regen]', m.el).onclick = () => { m.close(); bioModal(b); };
  wireAI(m.el, () => tpl(PROMPTS.find(p => p.n.startsWith('Posicionamento')).p, { ...brandVars(b), pilares: profile(b).pilares }));
}

/* ---------- Prompts ---------- */
view('prompts', {
  title: 'Prompts para IA', icon: 'bot', sub: 'Biblioteca pronta com os dados da sua marca',
  render(el) {
    const cat = state.ui.promptCat || 'Todos';
    const cats = ['Todos', ...new Set(PROMPTS.map(p => p.cat)), 'Meus prompts'];
    const b = genBrand(), p = profile(b);
    const vars = { ...brandVars(b), pilares: p.pilares, cores: `${p.color} e ${p.color2}`, mes: MONTHS[new Date().getMonth()], tema: state.ui.promptTema || '[tema]', objetivo: 'autoridade' };
    const mine = DB.all('prompts').map(x => ({ cat: 'Meus prompts', n: x.name, p: x.text, id: x.id }));
    const list = [...PROMPTS, ...mine].filter(x => cat === 'Todos' || x.cat === cat);
    el.innerHTML = `<div class="card mb"><div class="row">${genBrandPicker() ? `<div style="width:260px">${genBrandPicker()}</div>` : ''}<label class="field" style="flex:1;min-width:240px"><span>Tema para preencher os prompts ({tema})</span><input id="pTema" value="${esc(state.ui.promptTema || '')}" placeholder="Ex.: Reforma tributária para prestadores de serviço"></label>
      <button class="btn primary" id="pNew">${ico('plus')}Criar meu prompt</button></div>
      <div class="chips">${cats.map(c => `<span class="chip ${c === cat ? 'on' : ''}" data-cat="${c}">${c}</span>`).join('')}</div></div>
      <div class="grid g2">${list.map((x, i) => { const filled = tpl(x.p, vars); return `<div class="card"><div class="row"><span class="badge info">${x.cat}</span><strong>${esc(x.n)}</strong></div>
        <div class="out mt-s small" style="max-height:170px;overflow:auto">${esc(filled)}</div>
        <div class="row mt-s"><button class="btn xs" data-view="${i}">${ico('maximize-2')}Abrir</button><button class="btn xs" data-cp="${i}">${ico('copy')}Copiar</button><button class="btn xs" data-open="claude" data-for="${i}">${ico('external-link')}Claude</button><button class="btn xs" data-open="chatgpt" data-for="${i}">${ico('external-link')}ChatGPT</button><button class="btn xs primary" data-ai="${i}">${ico('sparkles')}Rodar aqui</button></div></div>`; }).join('')}</div>`;
    $$('[data-cat]', el).forEach(c => c.onclick = () => { state.ui.promptCat = c.dataset.cat; App.render(); });
    $('#pTema', el).onchange = e => { state.ui.promptTema = e.target.value; save(); App.render(); };
    $$('[data-cp]', el).forEach(bt => bt.onclick = () => copy(tpl(list[bt.dataset.cp].p, vars)));
    const editPrompt = (x = {}) => modal({ title: x.id ? 'Editar prompt' : 'Criar meu prompt', size: 'wide', body: `<p class="small muted" style="margin-top:0">Use variáveis: {marca} {publico} {servicos} {tom} {cidade} {tema} {dores} {diferenciais}</p>${F.text('name', 'Nome', x.name)}${F.area('text', 'Prompt', x.text, 8)}${F.brand(x.brand || 'both')}`,
      onSave: d => { if (!d.name.trim() || !d.text.trim()) { toast('Preencha nome e prompt'); return false; } if (x.id) DB.update('prompts', x.id, d); else DB.add('prompts', d); toast('Prompt salvo em “Meus prompts”'); App.render(); },
      onDelete: x.id ? () => { DB.remove('prompts', x.id); App.render(); } : null });
    $$('[data-view]', el).forEach(bt => bt.onclick = () => {
      const x = list[bt.dataset.view];
      const m = textModal(x.n, tpl(x.p, vars), { use: t => runAI(t, x.n), useLabel: 'Rodar com IA aqui' });
      if (x.id) { const eb = document.createElement('button'); eb.type = 'button'; eb.className = 'btn'; eb.textContent = 'Editar'; eb.onclick = () => { m.close(); editPrompt(DB.get('prompts', x.id)); }; $('.modal-foot', m.el).prepend(eb); }
    });
    wireAI(el, i => tpl(list[i].p, vars));
    $('#pNew', el).onclick = () => editPrompt();
  },
});
