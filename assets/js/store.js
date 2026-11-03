/* ===== Banco de dados: IndexedDB local + cópias automáticas + sincronização com a nuvem (Supabase) ===== */

const IDB_NAME = 'central_mkt', IDB_VERSION = 1, MAX_SNAPSHOTS = 20;
const SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
const COLLECTION_NAMES = {
  posts: 'Posts do calendário', ideas: 'Ideias', scripts: 'Roteiros', captions: 'Legendas', prompts: 'Prompts próprios', funnels: 'Funis',
  leads: 'Leads (CRM)', metrics: 'Métricas mensais', goals: 'Metas', competitors: 'Concorrentes', igposts: 'Métricas de posts do Instagram',
  wins: 'Portfólio de resultados', learn: 'Plano de estudos', links: 'Links rastreáveis',
};

/* Hash curto para detectar mudanças em cada registro */
function hashStr(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36) + s.length.toString(36); }
const reqP = r => new Promise((ok, no) => { r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
function loadScript(src) { return new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error('Não foi possível carregar ' + src)); document.head.appendChild(s); }); }
function stateCounts(s) { const o = {}; Object.entries((s || state).col || {}).forEach(([k, v]) => o[k] = v.length); return o; }
function totalRecords(s) { return Object.values(stateCounts(s)).reduce((a, b) => a + b, 0); }

/* ---------- Banco local (IndexedDB) ---------- */
const Store = {
  ready: false, db: null, mode: 'local', dirty: false, timer: null, lastSaved: null, persistent: false, lastSnapHash: '',
  open() {
    return new Promise((ok, no) => {
      if (!window.indexedDB) return no(new Error('IndexedDB indisponível'));
      const r = indexedDB.open(IDB_NAME, IDB_VERSION);
      r.onupgradeneeded = () => {
        const db = r.result;
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
        if (!db.objectStoreNames.contains('snapshots')) db.createObjectStore('snapshots', { keyPath: 'id', autoIncrement: true });
      };
      r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); r.onblocked = () => no(new Error('Banco bloqueado por outra aba'));
    });
  },
  tx(store, mode = 'readonly') { return this.db.transaction(store, mode).objectStore(store); },
  kvGet(k) { return reqP(this.tx('kv').get(k)); },
  kvSet(k, v) { return reqP(this.tx('kv', 'readwrite').put(v, k)); },

  async init() {
    try { this.db = await this.open(); this.mode = 'idb'; }
    catch (e) { console.warn(e); this.mode = 'local'; this.ready = true; Cloud.init(); return; }
    const fromIdb = await this.kvGet('state');
    const lsAt = state._savedAt || '', idbAt = fromIdb?._savedAt || '';
    if (fromIdb && idbAt >= lsAt) replaceState(fromIdb);           // banco local é a fonte principal
    else await this.kvSet('state', JSON.parse(JSON.stringify(state))); // primeira vez: migra o que estava no navegador
    this.ready = true;
    try { if (navigator.storage?.persist) this.persistent = await navigator.storage.persist(); } catch (e) { }
    this.snapshot('Abertura do sistema', true);
    setInterval(() => this.snapshot('Automática (a cada 30 min)', true), 30 * 60 * 1000);
    window.addEventListener('beforeunload', () => this.flushSync());
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') this.flush(); });
    Cloud.init();
  },
  persist() {
    this.dirty = true; clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), 250);
    Cloud.schedule();
    Cloud.badge();
  },
  /* Espelho síncrono no localStorage (garante a gravação mesmo se a aba fechar no meio) */
  flushSync() {
    if (!this.dirty) return;
    state._savedAt = new Date().toISOString();
    try { localStorage.setItem(APP_KEY, JSON.stringify(state)); } catch (e) { try { localStorage.removeItem(APP_KEY); } catch (_) { } }
    if (this.db) try { this.tx('kv', 'readwrite').put(JSON.parse(JSON.stringify(state)), 'state'); } catch (e) { }
  },
  async flush() {
    if (!this.dirty) return;
    this.dirty = false;
    state._savedAt = new Date().toISOString();
    const json = JSON.stringify(state);
    if (this.mode === 'idb') {
      try { await this.kvSet('state', JSON.parse(json)); this.lastSaved = new Date(); }
      catch (e) { this.dirty = true; toast('Erro ao gravar no banco local: ' + e.message); }
    }
    try { localStorage.setItem(APP_KEY, json); } catch (e) { try { localStorage.removeItem(APP_KEY); } catch (_) { } }
    if (this.mode !== 'idb') this.lastSaved = new Date();
  },

  /* Cópias automáticas (versões) */
  async snapshot(reason, auto) {
    if (this.mode !== 'idb') return null;
    const json = JSON.stringify({ ...state, ui: {} }), h = hashStr(json);
    if (auto && h === this.lastSnapHash) return null;
    const list = await this.snapshots();
    if (auto && list[0] && list[0].hash === h) { this.lastSnapHash = h; return null; }
    this.lastSnapHash = h;
    const id = await reqP(this.tx('snapshots', 'readwrite').add({ ts: new Date().toISOString(), reason, size: json.length, total: totalRecords(), counts: stateCounts(), hash: h, data: JSON.parse(json) }));
    const all = await this.snapshots();
    for (const s of all.slice(MAX_SNAPSHOTS)) await reqP(this.tx('snapshots', 'readwrite').delete(s.id));
    return id;
  },
  async snapshots() {
    if (this.mode !== 'idb') return [];
    const all = await reqP(this.tx('snapshots').getAll());
    return all.map(({ data, ...meta }) => meta).sort((a, b) => b.id - a.id);
  },
  async getSnapshot(id) { return reqP(this.tx('snapshots').get(id)); },
  async deleteSnapshot(id) { return reqP(this.tx('snapshots', 'readwrite').delete(id)); },
  /* Troca todos os dados (restaurar cópia / importar), guardando antes uma cópia de segurança */
  async replaceAll(data, reason) {
    await this.snapshot('Antes de: ' + reason, false);
    const keepUi = state.ui, keepSettings = state.settings, keepIg = state.ig;
    replaceState(data);
    state.ui = keepUi || {};
    if (!state.settings?.aiKey && keepSettings?.aiKey) state.settings = { ...(state.settings || {}), aiKey: keepSettings.aiKey };
    ['ordnas', 'vektra'].forEach(b => { if (keepIg?.[b]?.token && !state.ig[b]?.token) state.ig[b] = { ...state.ig[b], token: keepIg[b].token }; });
    this.dirty = true; await this.flush(); Cloud.schedule(); App.render();
  },
  async usage() { try { return await navigator.storage.estimate(); } catch (e) { return null; } },
};

/* ---------- Nuvem (Supabase / PostgreSQL) ---------- */
const CLOUD_KEY = 'central_mkt_cloud';
const Cloud = {
  client: null, user: null, status: 'off', lastSync: null, pending: 0, busy: false, error: '', timer: null, started: false, again: false,
  conf() { try { return JSON.parse(localStorage.getItem(CLOUD_KEY)) || {}; } catch (e) { return {}; } },
  setConf(c) { localStorage.setItem(CLOUD_KEY, JSON.stringify(c)); },
  configured() { const c = this.conf(); return !!(c.url && c.key); },
  async connect() {
    const c = this.conf();
    if (!c.url || !c.key) { this.client = null; this.set('off'); return false; }
    if (!window.supabase) await loadScript(SUPABASE_JS);
    this.client = window.supabase.createClient(c.url.trim(), c.key.trim(), { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'cmk-auth' } });
    const { data } = await this.client.auth.getSession();
    this.user = data.session?.user || null;
    this.client.auth.onAuthStateChange((ev, sess) => { const was = this.user?.id; this.user = sess?.user || null; if (this.user && this.user.id !== was) this.sync(); this.set(this.user ? this.status : 'login'); });
    this.set(this.user ? 'ok' : 'login');
    return true;
  },
  async init() {
    try { await this.connect(); } catch (e) { this.error = e.message; this.set('error'); }
    if (this.started) return; this.started = true;
    if (this.user) this.sync();
    setInterval(() => this.sync(), 60 * 1000);
    window.addEventListener('focus', () => this.sync());
    window.addEventListener('online', () => this.sync());
    window.addEventListener('offline', () => this.set('offline'));
  },
  set(s) { this.status = s; this.badge(); if (App.current === 'backup' && !$('.cmk-overlay') && document.activeElement?.tagName !== 'INPUT') App.render(); },
  badge() {
    const el = $('#dbBadge'); if (!el) return;
    const map = {
      off: ['hard-drive', 'Banco local', ''], login: ['log-in', 'Entrar na nuvem', 'warn'], ok: ['cloud', 'Sincronizado', 'ok'],
      syncing: ['refresh-cw', 'Sincronizando…', 'info'], pending: ['cloud-upload', 'Salvando na nuvem…', 'info'], offline: ['cloud-off', 'Sem internet', 'warn'], error: ['alert-triangle', 'Erro na nuvem', 'bad'],
    };
    const [ic, txt, cls] = map[this.status] || map.off;
    el.className = 'db-badge ' + cls; el.innerHTML = `${ico(ic)}<span>${txt}</span>`; el.title = this.error || txt; icons();
  },
  smKey() { return 'central_mkt_sync_' + (this.user?.id || 'x'); },
  sm() { try { return JSON.parse(localStorage.getItem(this.smKey())) || { lastPull: null, synced: {} }; } catch (e) { return { lastPull: null, synced: {} }; } },
  saveSm(sm) { try { localStorage.setItem(this.smKey(), JSON.stringify(sm)); } catch (e) { console.warn(e); } },
  igNoTokens() { const o = {}; Object.entries(state.ig || {}).forEach(([b, c]) => { const { token, ...rest } = c || {}; o[b] = rest; }); return o; },
  /* Todos os registros locais como linhas da tabela "records" */
  records() {
    const m = new Map();
    Object.entries(state.col).forEach(([c, arr]) => arr.forEach(o => { if (o && o.id) m.set(c + '/' + o.id, { collection: c, id: String(o.id), brand: o.brand || null, data: o, h: hashStr(JSON.stringify(o)) }); }));
    const meta = { profiles: state.profiles, routine: state.routine || {}, igconf: this.igNoTokens() };
    Object.entries(meta).forEach(([id, data]) => m.set('_meta/' + id, { collection: '_meta', id, brand: null, data, h: hashStr(JSON.stringify(data)) }));
    return m;
  },
  applyRemote(r) {
    if (r.collection === '_meta') {
      if (r.deleted) return;
      if (r.id === 'profiles') state.profiles = normalizeState({ profiles: r.data }).profiles;
      else if (r.id === 'routine') state.routine = r.data || {};
      else if (r.id === 'igconf') Object.entries(r.data || {}).forEach(([b, c]) => { state.ig[b] = { ...c, ...(state.ig[b]?.token ? { token: state.ig[b].token } : {}) }; });
      return;
    }
    const arr = DB.raw(r.collection), i = arr.findIndex(x => x.id === r.id);
    if (r.deleted) { if (i >= 0) arr.splice(i, 1); }
    else if (i >= 0) arr[i] = r.data; else arr.push(r.data);
  },
  async pull(sm) {
    const local = this.records();
    const since = sm.lastPull ? new Date(new Date(sm.lastPull).getTime() - 2000).toISOString() : '1970-01-01T00:00:00Z';
    let from = 0, maxTs = sm.lastPull, changed = 0;
    for (;;) {
      const { data, error } = await this.client.from('records').select('collection,id,data,deleted,updated_at').gt('updated_at', since).order('updated_at', { ascending: true }).range(from, from + 999);
      if (error) throw error;
      for (const r of data) {
        const key = r.collection + '/' + r.id, loc = local.get(key);
        const remoteH = r.deleted ? null : hashStr(JSON.stringify(r.data));
        if (!loc && r.deleted) { delete sm.synced[key]; }
        else if (loc && loc.h === remoteH) { sm.synced[key] = remoteH; }
        else {
          const localDirty = loc && sm.synced[key] !== loc.h;
          let useRemote = !localDirty;
          if (localDirty && r.collection === '_meta' && sm.synced[key] === undefined) useRemote = true; // aparelho novo: vale o que está na nuvem
          if (localDirty && r.collection !== '_meta' && !r.deleted) useRemote = (r.data?.updatedAt || r.data?.createdAt || '') > (loc.data.updatedAt || loc.data.createdAt || '');
          if (useRemote) { this.applyRemote(r); changed++; if (r.deleted) delete sm.synced[key]; else sm.synced[key] = remoteH; }
        }
        if (!maxTs || r.updated_at > maxTs) maxTs = r.updated_at;
      }
      if (data.length < 1000) break; from += 1000;
    }
    sm.lastPull = maxTs;
    return changed;
  },
  async push(sm) {
    const local = this.records(), rows = [], uidv = this.user.id;
    local.forEach((r, key) => { if (sm.synced[key] !== r.h) rows.push({ key, h: r.h, row: { user_id: uidv, collection: r.collection, id: r.id, brand: r.brand, data: r.data, deleted: false } }); });
    Object.keys(sm.synced).forEach(key => { if (!local.has(key)) { const i = key.indexOf('/'); rows.push({ key, h: null, row: { user_id: uidv, collection: key.slice(0, i), id: key.slice(i + 1), brand: null, data: {}, deleted: true } }); } });
    this.pending = rows.length;
    for (let i = 0; i < rows.length; i += 300) {
      const chunk = rows.slice(i, i + 300);
      const { error } = await this.client.from('records').upsert(chunk.map(x => x.row), { onConflict: 'user_id,collection,id' });
      if (error) throw error;
      chunk.forEach(x => { if (x.h === null) delete sm.synced[x.key]; else sm.synced[x.key] = x.h; });
      this.pending = Math.max(0, rows.length - i - chunk.length);
      this.saveSm(sm);
    }
    return rows.length;
  },
  schedule() {
    if (!this.client || !this.user) return;
    clearTimeout(this.timer); this.timer = setTimeout(() => this.sync(), 2000);
    if (this.status !== 'syncing') this.set('pending');
  },
  async sync(force) {
    if (!this.client || !this.user) return;
    if (this.busy) { this.again = true; return; }
    if (!navigator.onLine) { this.set('offline'); return; }
    this.busy = true; this.set('syncing');
    try {
      const sm = this.sm();
      if (force) { sm.synced = {}; sm.lastPull = null; }
      const changed = await this.pull(sm);
      this.saveSm(sm);
      if (changed) { Store.dirty = true; await Store.flush(); if (!$('.cmk-overlay')) App.render(); }
      await this.push(sm);
      this.saveSm(sm);
      this.lastSync = new Date(); this.error = ''; this.busy = false; this.set('ok');
    } catch (e) {
      console.error(e); this.busy = false;
      this.error = e.message || String(e);
      if (/relation .*records.* does not exist|Could not find the table/i.test(this.error)) this.error = 'A tabela "records" ainda não existe no Supabase. Rode o script SQL da tela Banco de dados → Nuvem.';
      const net = !navigator.onLine || /Failed to fetch|NetworkError|Load failed|network/i.test(this.error);
      if (net) this.error = 'Sem conexão com a internet. As alterações ficam salvas neste computador e serão enviadas quando a conexão voltar.';
      this.set(net ? 'offline' : 'error');
    }
    if (this.again) { this.again = false; setTimeout(() => this.sync(), 500); }
  },
  async signIn(email, password) { const { error } = await this.client.auth.signInWithPassword({ email, password }); if (error) throw error; },
  async signUp(email, password) { const { data, error } = await this.client.auth.signUp({ email, password }); if (error) throw error; return data; },
  async signOut() { await this.client.auth.signOut(); this.user = null; this.set('login'); },
  async remoteCount() { const { count, error } = await this.client.from('records').select('id', { count: 'exact', head: true }).eq('deleted', false); if (error) throw error; return count; },
};

const CLOUD_SQL = `-- Central de Marketing: tabela única com todos os registros, protegida por usuário
create table if not exists public.records (
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  collection text not null,
  id         text not null,
  brand      text,
  data       jsonb not null default '{}'::jsonb,
  deleted    boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, collection, id)
);
create index if not exists records_sync_idx on public.records (user_id, updated_at);
create index if not exists records_collection_idx on public.records (user_id, collection) where not deleted;

-- O servidor define a data de alteração (evita conflito de relógio entre computadores)
create or replace function public.records_touch() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists records_touch on public.records;
create trigger records_touch before insert or update on public.records
  for each row execute function public.records_touch();

-- Segurança: cada usuário só lê e grava os próprios dados
alter table public.records enable row level security;
drop policy if exists "records_select_own" on public.records;
drop policy if exists "records_insert_own" on public.records;
drop policy if exists "records_update_own" on public.records;
drop policy if exists "records_delete_own" on public.records;
create policy "records_select_own" on public.records for select using (auth.uid() = user_id);
create policy "records_insert_own" on public.records for insert with check (auth.uid() = user_id);
create policy "records_update_own" on public.records for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "records_delete_own" on public.records for delete using (auth.uid() = user_id);`;
