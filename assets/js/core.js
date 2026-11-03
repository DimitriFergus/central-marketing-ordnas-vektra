/* ===== Núcleo: estado, banco local, navegação e componentes de interface ===== */
const APP_KEY = 'central_mkt_v1';

const BRANDS = {
  ordnas: { id: 'ordnas', name: 'ORDNAS', full: 'ORDNAS Contabilidade' },
  vektra: { id: 'vektra', name: 'VEKTRA', full: 'VEKTRA Contabilidade' },
};

const DEFAULT_PROFILES = {
  ordnas: {
    name: 'ORDNAS Contabilidade', handle: '@ordnascontabilidade', city: '', whatsapp: '', site: '',
    publico: 'Pequenas e médias empresas, prestadores de serviço, profissionais liberais e MEIs que querem crescer',
    servicos: 'Abertura de empresa, contabilidade mensal, departamento pessoal, planejamento tributário, IRPF, BPO financeiro',
    diferenciais: 'Atendimento próximo e humano, especialistas por área, respostas rápidas pelo WhatsApp',
    tom: 'Profissional, próximo e didático', pilares: 'Educação fiscal, Dicas rápidas, Bastidores, Prova social, Oferta',
    dores: 'Medo de multa, pagar imposto demais, contador que não responde, falta de tempo com burocracia',
    color: '#1e3a8a', color2: '#c9a227',
  },
  vektra: {
    name: 'VEKTRA Contabilidade', handle: '@vektracontabilidade', city: '', whatsapp: '', site: '',
    publico: 'Empresas digitais, startups, e-commerces, agências e prestadores de serviço que querem contabilidade moderna',
    servicos: 'Contabilidade digital, abertura de empresa, planejamento tributário, BPO financeiro, gestão de folha',
    diferenciais: 'Processos 100% digitais, dashboards, atendimento ágil, foco em crescimento',
    tom: 'Moderno, direto e estratégico', pilares: 'Educação tributária, Gestão e números, Tecnologia, Prova social, Oferta',
    dores: 'Imposto alto no regime errado, falta de números claros, burocracia lenta, contador desatualizado',
    color: '#6d28d9', color2: '#14b8a6',
  },
};

function defaults() {
  return {
    brand: 'ordnas', theme: 'light', col: {},
    profiles: JSON.parse(JSON.stringify(DEFAULT_PROFILES)),
    ig: { ordnas: { version: 'v24.0' }, vektra: { version: 'v24.0' } },
    routine: {}, ui: {},
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(APP_KEY);
    if (raw) {
      const s = JSON.parse(raw), d = defaults();
      s.profiles = { ordnas: { ...d.profiles.ordnas, ...(s.profiles || {}).ordnas }, vektra: { ...d.profiles.vektra, ...(s.profiles || {}).vektra } };
      s.ig = { ...d.ig, ...(s.ig || {}) };
      return { ...d, ...s };
    }
  } catch (e) { console.error(e); }
  return defaults();
}
const state = loadState();

function save() {
  try { localStorage.setItem(APP_KEY, JSON.stringify(state)); }
  catch (e) { toast('Não foi possível salvar: armazenamento do navegador cheio. Faça um backup.'); }
}

/* ===== Banco de dados local ===== */
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function curBrand() { return state.brand === 'all' ? 'ordnas' : state.brand; }
function profile(b) { return state.profiles[b || curBrand()]; }

const DB = {
  raw(c) { return (state.col[c] ||= []); },
  all(c, any) {
    const a = this.raw(c);
    if (any || state.brand === 'all') return a;
    return a.filter(x => x.brand === state.brand || x.brand === 'both');
  },
  get(c, id) { return this.raw(c).find(x => x.id === id); },
  add(c, o) {
    o.id = o.id || uid(); o.brand = o.brand || curBrand(); o.createdAt = o.createdAt || new Date().toISOString();
    this.raw(c).push(o); save(); return o;
  },
  update(c, id, p) { const o = this.get(c, id); if (o) { Object.assign(o, p); save(); } return o; },
  remove(c, id) { state.col[c] = this.raw(c).filter(x => x.id !== id); save(); },
  upsert(c, o) { return o.id && this.get(c, o.id) ? this.update(c, o.id, o) : this.add(c, o); },
};

/* ===== Utilidades ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function shuffle(a) { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
function num(v) { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? 0 : n; }
function sum(a, f = x => x) { return a.reduce((s, x) => s + (num(f(x)) || 0), 0); }
function avg(a, f = x => x) { return a.length ? sum(a, f) / a.length : 0; }

const fmt = {
  money: n => (num(n)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: num(n) >= 1000 ? 0 : 2 }),
  num: (n, d = 0) => (num(n)).toLocaleString('pt-BR', { maximumFractionDigits: d }),
  pct: (n, d = 1) => (num(n)).toLocaleString('pt-BR', { maximumFractionDigits: d }) + '%',
  date: s => { if (!s) return ''; const d = parseYMD(s); return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }); },
  dateLong: s => { if (!s) return ''; const d = parseYMD(s); return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }); },
};
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
function ymd(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function parseYMD(s) { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d || 1); }
function today() { return ymd(new Date()); }
function addDays(s, n) { const d = parseYMD(s); d.setDate(d.getDate() + n); return ymd(d); }
function monthKey(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }
function tpl(str, vars) { return String(str).replace(/\{(\w+)\}/g, (m, k) => vars[k] !== undefined && vars[k] !== '' ? vars[k] : m); }
function brandVars(b, extra = {}) {
  const p = profile(b);
  return {
    marca: p.name, handle: p.handle, publico: p.publico, servicos: p.servicos, diferenciais: p.diferenciais,
    tom: p.tom, cidade: p.city || 'sua cidade', whatsapp: p.whatsapp || '(WhatsApp)', site: p.site || '(site)', dores: p.dores, ...extra,
  };
}

function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
  $('#toasts').appendChild(t); setTimeout(() => t.remove(), 2600);
}
async function copy(text) {
  try { await navigator.clipboard.writeText(text); }
  catch (e) { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
  toast('Copiado para a área de transferência');
}
function icons() { if (window.lucide) lucide.createIcons(); }
function download(name, content, type = 'application/json') {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type })); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function ico(n) { return `<i data-lucide="${n}"></i>`; }
function brandBadge(b) { if (b === 'both') return '<span class="badge">Ambas</span>'; const x = BRANDS[b]; return x ? `<span class="badge b-${b}">${x.name}</span>` : ''; }
function emptyState(msg, icon = 'inbox') { return `<div class="empty">${ico(icon)}${msg}</div>`; }

/* ===== Campos de formulário ===== */
const F = {
  text: (n, l, v = '', a = '') => `<label class="field"><span>${l}</span><input name="${n}" value="${esc(v)}" ${a}></label>`,
  num: (n, l, v = '', a = '') => `<label class="field"><span>${l}</span><input type="number" step="any" name="${n}" value="${esc(v)}" ${a}></label>`,
  date: (n, l, v = '') => `<label class="field"><span>${l}</span><input type="date" name="${n}" value="${esc(v)}"></label>`,
  time: (n, l, v = '') => `<label class="field"><span>${l}</span><input type="time" name="${n}" value="${esc(v)}"></label>`,
  area: (n, l, v = '', r = 4, a = '') => `<label class="field"><span>${l}</span><textarea name="${n}" rows="${r}" ${a}>${esc(v)}</textarea></label>`,
  select: (n, l, opts, v = '', a = '') => `<label class="field"><span>${l}</span><select name="${n}" ${a}>${opts.map(o => { const [val, lab] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(val)}" ${String(val) === String(v) ? 'selected' : ''}>${esc(lab)}</option>`; }).join('')}</select></label>`,
  brand: (v, both = true) => F.select('brand', 'Marca', [['ordnas', 'ORDNAS Contabilidade'], ['vektra', 'VEKTRA Contabilidade'], ...(both ? [['both', 'Ambas as marcas']] : [])], v || curBrand()),
  check: (n, l, v) => `<label class="chk"><input type="checkbox" name="${n}" ${v ? 'checked' : ''}> ${l}</label>`,
};
function formData(root) {
  const o = {};
  $$('[name]', root).forEach(i => {
    if (i.type === 'checkbox') o[i.name] = i.checked;
    else if (i.type === 'radio') { if (i.checked) o[i.name] = i.value; }
    else if (i.type === 'number') o[i.name] = i.value === '' ? '' : num(i.value);
    else o[i.name] = i.value;
  });
  return o;
}

/* ===== Modal ===== */
function modal({ title, body, onSave, saveLabel = 'Salvar', size = '', onDelete, extraBtns = '', onOpen }) {
  const w = document.createElement('div'); w.className = 'modal-backdrop';
  w.innerHTML = `<div class="modal ${size}"><div class="modal-head"><h3>${esc(title)}</h3><button type="button" class="icon-btn" data-close>${ico('x')}</button></div>
    <form class="modal-body" autocomplete="off">${body}</form>
    <div class="modal-foot">${onDelete ? `<button type="button" class="btn danger" data-del>${ico('trash-2')}Excluir</button>` : ''}${extraBtns}<span class="sp"></span>
    <button type="button" class="btn ghost" data-close>${onSave ? 'Cancelar' : 'Fechar'}</button>${onSave ? `<button type="button" class="btn primary" data-save>${saveLabel}</button>` : ''}</div></div>`;
  document.body.appendChild(w);
  const form = $('form', w);
  $$('button:not([type])', form).forEach(b => b.type = 'button');
  const esc_ = e => { if (e.key === 'Escape' && w === $$('.modal-backdrop').pop()) close(); };
  const close = () => { w.remove(); document.removeEventListener('keydown', esc_); };
  document.addEventListener('keydown', esc_);
  const doSave = () => { if (onSave(formData(form), form, w) !== false) close(); };
  w.addEventListener('mousedown', e => { if (e.target === w) close(); });
  $$('[data-close]', w).forEach(b => b.onclick = close);
  if (onSave) $('[data-save]', w).onclick = doSave;
  form.addEventListener('submit', e => { e.preventDefault(); if (onSave) doSave(); });
  if (onDelete) $('[data-del]', w).onclick = () => confirmBox('Tem certeza que deseja excluir? Esta ação não pode ser desfeita.', () => { onDelete(); close(); }, { danger: true, yes: 'Excluir' });
  icons();
  const first = $('input:not([type=hidden]),textarea,select', form); if (first && !onOpen?.noFocus) setTimeout(() => first.focus(), 50);
  if (onOpen) onOpen(form, w, close);
  return { el: w, form, close };
}
/* Links internos dentro de uma janela fecham a janela ao navegar */
document.addEventListener('click', e => { const a = e.target.closest('.modal-backdrop a[href^="#/"]'); if (a) $$('.modal-backdrop').forEach(m => m.remove()); });
/* Janela de confirmação (substitui o confirm do navegador) */
function confirmBox(msg, onYes, { title = 'Confirmar', yes = 'Confirmar', danger = false } = {}) {
  const m = modal({ title, body: `<p style="margin:0">${msg}</p>`, onSave: () => { onYes(); }, saveLabel: yes });
  if (danger) $('[data-save]', m.el).className = 'btn danger';
  return m;
}
/* Janela para digitar um valor (substitui o prompt do navegador) */
function promptBox(title, label, def, onOk, { saveLabel = 'OK', type = 'text', options } = {}) {
  return modal({ title, saveLabel,
    body: options ? F.select('v', label, options, def) : `<label class="field"><span>${esc(label)}</span><input name="v" type="${type}" value="${esc(def ?? '')}"></label>`,
    onSave: d => { if (!String(d.v ?? '').trim()) { toast('Preencha o campo'); return false; } return onOk(d.v); } });
}
/* Janela de resultado com texto gerado + ações */
function textModal(title, text, { use, useLabel = 'Usar este texto', save, size = 'wide' } = {}) {
  const m = modal({ title, size, body: `<textarea id="tmText" rows="18">${esc(text)}</textarea><div class="muted small mt-s" id="tmCnt">${text.length} caracteres</div>`,
    extraBtns: `<button type="button" class="btn" data-tm="copy">${ico('copy')}Copiar</button>${save ? `<button type="button" class="btn" data-tm="save">${ico('save')}Salvar</button>` : ''}${use ? `<button type="button" class="btn primary" data-tm="use">${ico('check')}${useLabel}</button>` : ''}` });
  const val = () => $('#tmText', m.el).value;
  $('#tmText', m.el).oninput = () => { $('#tmCnt', m.el).textContent = val().length + ' caracteres'; };
  $('[data-tm=copy]', m.el).onclick = () => copy(val());
  if (save) $('[data-tm=save]', m.el).onclick = () => { save(val()); };
  if (use) $('[data-tm=use]', m.el).onclick = () => { use(val()); m.close(); };
  return m;
}

/* ===== Gráficos (SVG simples, sem dependências) ===== */
function lineChart(series, labels, { h = 220, money = false } = {}) {
  const W = 640, H = h, pl = 46, pr = 14, pt = 14, pb = 28;
  const all = series.flatMap(s => s.data.map(num));
  const max = Math.max(1, ...all) * 1.1;
  const n = Math.max(labels.length, 1);
  const x = i => pl + (n === 1 ? (W - pl - pr) / 2 : i * (W - pl - pr) / (n - 1));
  const y = v => pt + (H - pt - pb) * (1 - num(v) / max);
  let g = '';
  for (let i = 0; i <= 4; i++) {
    const v = max * i / 4, yy = y(v);
    g += `<line class="grid-l" x1="${pl}" x2="${W - pr}" y1="${yy}" y2="${yy}"/><text x="${pl - 6}" y="${yy + 4}" text-anchor="end">${money ? 'R$' + fmt.num(v) : fmt.num(v)}</text>`;
  }
  labels.forEach((l, i) => { g += `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${esc(l)}</text>`; });
  series.forEach(s => {
    const pts = s.data.map((v, i) => `${x(i)},${y(v)}`).join(' ');
    g += `<polyline fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linejoin="round" points="${pts}"/>`;
    s.data.forEach((v, i) => { g += `<circle cx="${x(i)}" cy="${y(v)}" r="3.5" fill="${s.color}"><title>${esc(s.name)} — ${esc(labels[i])}: ${money ? fmt.money(v) : fmt.num(v, 2)}</title></circle>`; });
  });
  const legend = series.length > 1 ? `<div class="legend mt-s">${series.map(s => `<span><i class="dot" style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>` : '';
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}">${g}</svg>${legend}</div>`;
}
function hbars(items, { money = false, suffix = '' } = {}) {
  const max = Math.max(1, ...items.map(i => num(i.value)));
  return items.map(i => `<div class="hbar"><span class="l" title="${esc(i.label)}">${esc(i.label)}</span><div class="b"><div style="width:${num(i.value) / max * 100}%;background:${i.color || 'var(--brand)'}"></div></div><span class="v">${money ? fmt.money(i.value) : fmt.num(i.value, 1) + suffix}</span></div>`).join('');
}

/* ===== Abas reutilizáveis ===== */
function tabs(key, list, def) {
  const cur = state.ui[key] || def || list[0][0];
  return { cur, html: `<div class="tabs">${list.map(([id, l]) => `<button data-tab="${id}" data-tabkey="${key}" class="${id === cur ? 'on' : ''}">${l}</button>`).join('')}</div>` };
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-tabkey]'); if (!b) return;
  state.ui[b.dataset.tabkey] = b.dataset.tab; save(); App.render();
});

/* ===== Navegação ===== */
const Views = {};
const NAV = [
  ['Visão geral', ['dashboard']],
  ['Planejamento', ['calendar', 'production', 'ideas', 'dates']],
  ['Conteúdo', ['scripts', 'captions', 'prompts']],
  ['Vendas', ['funnels', 'leads']],
  ['Tráfego & Instagram', ['instagram', 'ads', 'budget', 'utm']],
  ['Gestão & Carreira', ['metrics', 'goals', 'competitors', 'routine', 'brand']],
];
function view(id, def) { Views[id] = def; }

const App = {
  current: 'dashboard',
  boot() {
    this.applyTheme();
    this.buildNav();
    $$('#brandSwitch button').forEach(b => b.onclick = () => { state.brand = b.dataset.brand; save(); this.render(); });
    $('#themeBtn').onclick = () => { state.theme = state.theme === 'dark' ? 'light' : 'dark'; save(); this.applyTheme(); };
    $('#menuBtn').onclick = () => $('#sidebar').classList.toggle('open');
    window.addEventListener('hashchange', () => this.render());
    this.render();
  },
  applyTheme() {
    document.documentElement.dataset.theme = state.theme;
    $('#themeBtn').innerHTML = ico(state.theme === 'dark' ? 'sun' : 'moon'); icons();
  },
  applyBrand() {
    const p = state.brand === 'all' ? { color: '#0f766e', color2: '#c9a227' } : profile();
    const r = document.documentElement.style;
    r.setProperty('--brand', p.color); r.setProperty('--brand2', p.color2);
    r.setProperty('--brand-soft', hexA(p.color, .1));
    $$('#brandSwitch button').forEach(b => b.classList.toggle('on', b.dataset.brand === state.brand));
  },
  buildNav() {
    $('#nav').innerHTML = NAV.map(([g, ids]) => `<div class="nav-group">${g}</div>` + ids.filter(id => Views[id]).map(id =>
      `<a class="nav-item" href="#/${id}" data-nav="${id}">${ico(Views[id].icon)}<span>${Views[id].title}</span>${Views[id].isNew ? '<span class="new">NOVO</span>' : ''}</a>`).join('')).join('');
  },
  render() {
    const id = (location.hash.replace(/^#\/?/, '') || 'dashboard').split('?')[0];
    const v = Views[id] || Views.dashboard;
    this.current = Views[id] ? id : 'dashboard';
    this.applyBrand();
    $$('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === this.current));
    $$('.sidebar-foot .nav-item').forEach(a => a.classList.toggle('active', this.current === 'backup'));
    $('#pageTitle').textContent = v.title;
    const bn = state.brand === 'all' ? 'ORDNAS + VEKTRA' : BRANDS[state.brand].full;
    $('#pageSub').textContent = `${v.sub || ''}${v.sub ? ' · ' : ''}${bn}`;
    $('#sidebar').classList.remove('open');
    const main = $('#main'); main.innerHTML = '';
    try { v.render(main); } catch (e) { console.error(e); main.innerHTML = `<div class="tip warn">Erro ao carregar esta tela: ${esc(e.message)}</div>`; }
    icons();
  },
};
function hexA(hex, a) {
  const h = hex.replace('#', ''); const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
/* Gera a escolha de marca em telas de geração (quando "Ambas" está selecionado) */
function genBrand() { return state.brand === 'all' ? (state.ui.genBrand || 'ordnas') : state.brand; }
function genBrandPicker() {
  if (state.brand !== 'all') return '';
  return `<label class="field"><span>Gerar para</span><select id="genBrandSel">${Object.values(BRANDS).map(b => `<option value="${b.id}" ${genBrand() === b.id ? 'selected' : ''}>${b.full}</option>`).join('')}</select></label>`;
}
document.addEventListener('change', e => { if (e.target.id === 'genBrandSel') { state.ui.genBrand = e.target.value; save(); App.render(); } });
