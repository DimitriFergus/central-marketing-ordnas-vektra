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
function wireAI(root, getPrompt, onResult) {
  $$('[data-ai]', root).forEach(b => b.onclick = async () => {
    if (!hasAI()) { location.hash = '#/brand'; state.ui.brandTab = 'ia'; save(); toast('Configure a chave da API para gerar direto aqui'); return; }
    const old = b.innerHTML; b.disabled = true; b.innerHTML = 'Gerando…';
    try { onResult(await aiGenerate(getPrompt(b.dataset.ai)), b.dataset.ai); }
    catch (e) { toast('Erro: ' + e.message); console.error(e); }
    finally { b.disabled = false; b.innerHTML = old; icons(); }
  });
  $$('[data-open]', root).forEach(b => b.onclick = () => {
    const p = encodeURIComponent(getPrompt(b.dataset.for));
    window.open(b.dataset.open === 'claude' ? `https://claude.ai/new?q=${p}` : `https://chatgpt.com/?q=${p}`, '_blank');
  });
}

function temaVars(tema, brand, objetivo = 'autoridade') {
  const v = brandVars(brand);
  const t = (tema || 'contabilidade da sua empresa').trim();
  const curto = t.split(/[:?!—\-(]/)[0].trim().split(' ').slice(0, 6).join(' ');
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
      <div class="card" style="align-self:start"><h3>${ico('settings-2')}Configuração</h3><form id="scrForm">
        ${genBrandPicker()}
        <label class="field"><span>Tema do conteúdo</span><input name="tema" list="topicList" value="${esc(last.tema)}" placeholder="Ex.: Pró-labore x distribuição de lucros"></label>
        <datalist id="topicList">${TOPICS.map(t => `<option value="${esc(t.t)}">`).join('')}</datalist>
        <button type="button" class="btn xs mb" id="rndTopic">${ico('shuffle')}Tema aleatório</button>
        ${F.select('formato', 'Formato', Object.entries(SCRIPT_FORMATS).map(([k, v]) => [k, v.name]), last.formato)}
        ${F.select('estrutura', 'Estrutura / técnica', Object.entries(SCRIPT_STRUCTURES).map(([k, v]) => [k, v.name]), last.estrutura)}
        ${F.select('objetivo', 'Objetivo', OBJECTIVES, last.objetivo)}
        <button class="btn primary" style="width:100%;justify-content:center">${ico('wand-2')}Gerar roteiro</button></form>
        <div class="tip mt small"><strong>Dica de analista:</strong> grave 4-6 roteiros no mesmo dia (batch). Use o teleprompter no celular ou notebook.</div></div>
      <div id="scrOut">${emptyState('Escolha um tema e clique em “Gerar roteiro”. Você poderá trocar o gancho, editar, salvar e abrir no teleprompter.', 'clapperboard')}</div></div>`;
    $('#rndTopic', body).onclick = () => { $('[name=tema]', body).value = tpl(pick(TOPICS).t, brandVars(genBrand())); };
    const gen = (hook) => {
      const d = formData($('#scrForm', body)); d.brand = genBrand();
      state.ui.lastScript = d; save();
      const r = buildScript({ ...d, hook });
      $('#scrOut', body).innerHTML = `<div class="card"><div class="card-head"><h3>${ico('file-text')}${esc(d.tema || 'Roteiro')}</h3><span class="sp"></span><span class="badge">${esc(r.name)}</span></div>
        <div class="field"><span>Escolha o gancho (clique para trocar)</span><div class="chips">${r.hooks.map(h => `<span class="chip" data-hook="${esc(h)}">${esc(h)}</span>`).join('')}</div></div>
        <textarea id="scrText" rows="18">${esc(r.text)}</textarea>
        <div class="tip mt-s small">🎬 <strong>${esc(SCRIPT_FORMATS[d.formato].name)}:</strong> ${esc(r.tips)}</div>
        <div class="row mt"><button class="btn primary" id="scrSave">${ico('save')}Salvar roteiro</button><button class="btn" id="scrPrompter">${ico('monitor-play')}Teleprompter</button><button class="btn" id="scrCopy">${ico('copy')}Copiar</button><button class="btn" id="scrPost">${ico('calendar-plus')}Agendar post</button></div>
        <hr><div class="small muted mb">Quer um roteiro 100% escrito (com falas completas)? Use a IA com todo o contexto da marca:</div><div class="row">${aiButtons('scr')}</div></div>`;
      $$('[data-hook]', body).forEach(c => c.onclick = () => gen(c.dataset.hook));
      $('#scrSave', body).onclick = () => { DB.add('scripts', { brand: d.brand, title: d.tema || 'Roteiro', formato: d.formato, estrutura: d.estrutura, text: $('#scrText', body).value, status: 'rascunho' }); toast('Roteiro salvo'); };
      $('#scrPrompter', body).onclick = () => teleprompter($('#scrText', body).value);
      $('#scrCopy', body).onclick = () => copy($('#scrText', body).value);
      $('#scrPost', body).onclick = () => editPost({ title: d.tema, brand: d.brand, script: $('#scrText', body).value, format: d.formato === 'carrossel' ? 'Carrossel' : d.formato === 'stories' ? 'Stories' : d.formato === 'live' ? 'Live' : 'Reels', objective: d.objetivo, status: 'roteiro' });
      wireAI(body, () => scriptPrompt(d), txt => { $('#scrText', body).value = txt; toast('Roteiro gerado pela IA'); });
      icons();
    };
    $('#scrForm', body).onsubmit = e => { e.preventDefault(); gen(); };
    if (last.tema) gen();
  },
});
function renderSavedScripts(body) {
  const list = DB.all('scripts').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  body.innerHTML = list.length ? `<div class="grid g3">${list.map(s => `<div class="card"><div class="row"><span class="badge">${esc(SCRIPT_FORMATS[s.formato]?.name || s.formato)}</span>${state.brand === 'all' ? brandBadge(s.brand) : ''}<span class="badge ${s.status === 'gravado' ? 'ok' : ''}">${s.status === 'gravado' ? 'Gravado' : 'Rascunho'}</span></div>
    <div class="t mt-s" style="font-weight:700">${esc(s.title)}</div><div class="muted small mt-s" style="max-height:60px;overflow:hidden">${esc(s.text.slice(0, 160))}…</div>
    <div class="row mt"><button class="btn xs" data-open-s="${s.id}">${ico('pencil')}Abrir</button><button class="btn xs" data-tp="${s.id}">${ico('monitor-play')}Teleprompter</button><button class="btn xs" data-done="${s.id}">${ico('check')}${s.status === 'gravado' ? 'Desmarcar' : 'Gravado'}</button></div></div>`).join('')}</div>`
    : `<div class="card">${emptyState('Nenhum roteiro salvo ainda.', 'clapperboard')}</div>`;
  $$('[data-tp]', body).forEach(b => b.onclick = () => teleprompter(DB.get('scripts', b.dataset.tp).text));
  $$('[data-done]', body).forEach(b => b.onclick = () => { const s = DB.get('scripts', b.dataset.done); DB.update('scripts', s.id, { status: s.status === 'gravado' ? 'rascunho' : 'gravado' }); App.render(); });
  $$('[data-open-s]', body).forEach(b => b.onclick = () => {
    const s = DB.get('scripts', b.dataset.openS);
    modal({ title: s.title, size: 'wide', body: F.text('title', 'Título', s.title) + F.area('text', 'Roteiro', s.text, 18),
      onSave: d => { DB.update('scripts', s.id, d); App.render(); }, onDelete: () => { DB.remove('scripts', s.id); App.render(); },
      extraBtns: `<button type="button" class="btn" id="mTp">${ico('monitor-play')}Teleprompter</button>`,
      onOpen: f => { $('#mTp').onclick = () => teleprompter($('[name=text]', f).value); } });
  });
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
      body.innerHTML = list.length ? `<div class="grid g2">${list.map(c => `<div class="card"><div class="row"><strong>${esc(c.title)}</strong>${state.brand === 'all' ? brandBadge(c.brand) : ''}<span class="sp"></span><span class="muted small">${c.text.length} caracteres</span></div><div class="out mt-s">${esc(c.text)}</div><div class="row mt-s"><button class="btn xs" data-cp="${c.id}">${ico('copy')}Copiar</button><button class="btn xs" data-use="${c.id}">${ico('calendar-plus')}Usar em post</button><button class="btn xs danger" data-rm="${c.id}">${ico('trash-2')}</button></div></div>`).join('')}</div>` : `<div class="card">${emptyState('Nenhuma legenda salva.', 'type')}</div>`;
      $$('[data-cp]', body).forEach(b => b.onclick = () => copy(DB.get('captions', b.dataset.cp).text));
      $$('[data-use]', body).forEach(b => b.onclick = () => { const c = DB.get('captions', b.dataset.use); editPost({ title: c.title, caption: c.text, brand: c.brand }); });
      $$('[data-rm]', body).forEach(b => b.onclick = () => { DB.remove('captions', b.dataset.rm); App.render(); });
      return;
    }
    if (tb.cur === 'bio') {
      const b = genBrand();
      body.innerHTML = `<div class="grid g-side-l"><div class="card" style="align-self:start">${genBrandPicker()}<p class="small muted">A bio usa os dados de <a href="#/brand">Marca & IA</a>. Limite do Instagram: 150 caracteres.</p><button class="btn primary" id="bioGen">${ico('refresh-cw')}Gerar opções</button>
        <div class="tip mt small"><strong>Checklist de bio que converte:</strong><br>✔ Quem você ajuda<br>✔ Como ajuda (serviço)<br>✔ Prova/diferencial<br>✔ Localização (busca local)<br>✔ CTA + link (WhatsApp ou página)</div></div>
        <div>${bioOptions(b).map(x => `<div class="out"><div>${esc(x)}</div><div class="out-actions"><span class="badge ${x.length > 150 ? 'bad' : 'ok'}">${x.length}/150</span><button class="btn xs" data-copy="${esc(x)}">${ico('copy')}Copiar</button></div></div>`).join('')}
        <div class="row mt">${aiButtons('bio')}</div><div id="bioAI"></div></div></div>`;
      $('#bioGen', body).onclick = () => App.render();
      $$('[data-copy]', body).forEach(x => x.onclick = () => copy(x.dataset.copy));
      wireAI(body, () => tpl(PROMPTS.find(p => p.n.startsWith('Posicionamento')).p, { ...brandVars(b), pilares: profile(b).pilares }), t => { $('#bioAI', body).innerHTML = `<div class="out mt">${esc(t)}</div>`; });
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
    const last = state.ui.lastCap || { tema: pre, objetivo: 'autoridade', tamanho: 'media', emojis: true, local: true, tags: ['Contabilidade', 'Empreendedorismo'] };
    if (pre) last.tema = pre;
    body.innerHTML = `<div class="grid g-side-l"><div class="card" style="align-self:start"><form id="capForm">${genBrandPicker()}
      <label class="field"><span>Tema do post</span><input name="tema" list="topicList2" value="${esc(last.tema)}" placeholder="Ex.: Fator R para prestadores de serviço"></label><datalist id="topicList2">${TOPICS.map(t => `<option value="${esc(t.t)}">`).join('')}</datalist>
      ${F.select('objetivo', 'Objetivo', OBJECTIVES, last.objetivo)}${F.select('tamanho', 'Tamanho', [['curta', 'Curta'], ['media', 'Média'], ['longa', 'Longa (storytelling)']], last.tamanho)}
      <div class="field"><span>Hashtags</span><div class="chips" id="tagChips">${Object.keys(HASHTAGS).map(k => `<span class="chip ${last.tags.includes(k) ? 'on' : ''}" data-tag="${k}">${k}</span>`).join('')}</div></div>
      ${F.check('emojis', 'Usar emojis', last.emojis)}${F.check('local', 'Incluir palavras-chave locais (cidade)', last.local)}
      <button class="btn primary mt" style="width:100%;justify-content:center">${ico('wand-2')}Gerar 3 legendas</button></form></div>
      <div id="capOut">${emptyState('Defina o tema e gere 3 variações. Os trechos entre [colchetes] são para você completar — ou use a IA para gerar o texto completo.', 'type')}</div></div>`;
    $$('#tagChips .chip', body).forEach(c => c.onclick = () => c.classList.toggle('on'));
    const gen = () => {
      const d = formData($('#capForm', body)); d.brand = genBrand(); d.tags = $$('#tagChips .chip.on', body).map(c => c.dataset.tag);
      state.ui.lastCap = d; save();
      const caps = buildCaptions(d);
      $('#capOut', body).innerHTML = caps.map((c, i) => `<div class="out"><h4>Variação ${i + 1}</h4><textarea rows="12" data-cap="${i}">${esc(c)}</textarea>
        <div class="out-actions"><span class="badge" data-cnt="${i}">${c.length}/2200</span><button class="btn xs" data-c="${i}">${ico('copy')}Copiar</button><button class="btn xs" data-s="${i}">${ico('save')}Salvar</button><button class="btn xs" data-p="${i}">${ico('calendar-plus')}Usar em post</button></div></div>`).join('')
        + `<div class="card mt"><div class="small muted mb">Gere legendas completas, sem colchetes, com a IA:</div><div class="row">${aiButtons('cap')}</div><div id="capAI"></div></div>`;
      const val = i => $(`[data-cap="${i}"]`, body).value;
      $$('[data-cap]', body).forEach(t => t.oninput = () => { $(`[data-cnt="${t.dataset.cap}"]`, body).textContent = t.value.length + '/2200'; });
      $$('[data-c]', body).forEach(b => b.onclick = () => copy(val(b.dataset.c)));
      $$('[data-s]', body).forEach(b => b.onclick = () => { DB.add('captions', { brand: d.brand, title: d.tema || 'Legenda', text: val(b.dataset.s), objetivo: d.objetivo }); toast('Legenda salva'); });
      $$('[data-p]', body).forEach(b => b.onclick = () => editPost({ title: d.tema, caption: val(b.dataset.p), brand: d.brand, objective: d.objetivo }));
      wireAI(body, () => captionPrompt(d), t => { $('#capAI', body).innerHTML = `<div class="out mt">${esc(t)}</div><div class="row mt-s"><button class="btn xs" id="capAIc">${ico('copy')}Copiar</button><button class="btn xs" id="capAIs">${ico('save')}Salvar</button></div>`; $('#capAIc').onclick = () => copy(t); $('#capAIs').onclick = () => { DB.add('captions', { brand: d.brand, title: d.tema, text: t }); toast('Salvo'); }; icons(); });
      icons();
    };
    $('#capForm', body).onsubmit = e => { e.preventDefault(); gen(); };
    if (last.tema) gen();
  },
});

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
      <button class="btn" id="pNew">${ico('plus')}Criar meu prompt</button></div>
      <div class="chips">${cats.map(c => `<span class="chip ${c === cat ? 'on' : ''}" data-cat="${c}">${c}</span>`).join('')}</div></div>
      <div class="grid g2">${list.map((x, i) => { const filled = tpl(x.p, vars); return `<div class="card"><div class="row"><span class="badge info">${x.cat}</span><strong>${esc(x.n)}</strong></div>
        <div class="out mt-s small" style="max-height:170px;overflow:auto">${esc(filled)}</div>
        <div class="row mt-s"><button class="btn xs" data-cp="${i}">${ico('copy')}Copiar</button><button class="btn xs" data-open="claude" data-for="${i}">${ico('external-link')}Claude</button><button class="btn xs" data-open="chatgpt" data-for="${i}">${ico('external-link')}ChatGPT</button><button class="btn xs primary" data-ai="${i}">${ico('sparkles')}Rodar aqui</button>${x.id ? `<button class="btn xs danger" data-rmp="${x.id}">${ico('trash-2')}</button>` : ''}</div><div data-res="${i}"></div></div>`; }).join('')}</div>`;
    $$('[data-cat]', el).forEach(c => c.onclick = () => { state.ui.promptCat = c.dataset.cat; App.render(); });
    $('#pTema', el).onchange = e => { state.ui.promptTema = e.target.value; save(); App.render(); };
    $$('[data-cp]', el).forEach(bt => bt.onclick = () => copy(tpl(list[bt.dataset.cp].p, vars)));
    $$('[data-rmp]', el).forEach(bt => bt.onclick = () => { DB.remove('prompts', bt.dataset.rmp); App.render(); });
    wireAI(el, i => tpl(list[i].p, vars), (t, i) => { const r = $(`[data-res="${i}"]`, el); r.innerHTML = `<div class="out mt-s">${esc(t)}</div><button class="btn xs mt-s" id="cpr${i}">${ico('copy')}Copiar resposta</button>`; $('#cpr' + i).onclick = () => copy(t); icons(); });
    $('#pNew', el).onclick = () => modal({ title: 'Novo prompt', body: `<p class="small muted">Use variáveis: {marca} {publico} {servicos} {tom} {cidade} {tema} {dores} {diferenciais}</p>${F.text('name', 'Nome')}${F.area('text', 'Prompt', '', 8)}${F.brand('both')}`,
      onSave: d => { DB.add('prompts', d); App.render(); } });
  },
});
