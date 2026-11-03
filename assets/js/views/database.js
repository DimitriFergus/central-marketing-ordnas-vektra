/* ===== Tela "Banco de dados": armazenamento, nuvem, cópias automáticas e exportação ===== */
function fmtBytes(n) { n = num(n); return n > 1048576 ? fmt.num(n / 1048576, 1) + ' MB' : fmt.num(n / 1024, 0) + ' KB'; }
function fmtWhen(d) { if (!d) return '—'; return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }

view('backup', {
  title: 'Banco de dados', icon: 'database', sub: 'Onde tudo o que você salva fica guardado',
  render(el) {
    const tb = tabs('dbTab', [['status', 'Visão geral'], ['cloud', 'Nuvem (sincronização)'], ['snaps', 'Cópias automáticas'], ['io', 'Exportar / importar']]);
    el.innerHTML = tb.html + '<div id="dbBody"></div>';
    const body = $('#dbBody', el);
    ({ status: dbStatus, cloud: dbCloud, snaps: dbSnaps, io: dbIO })[tb.cur](body);
  },
});

async function dbStatus(body) {
  const counts = stateCounts(), total = totalRecords();
  const cloudTxt = { off: 'Não configurada', login: 'Configurada — falta entrar', ok: 'Sincronizada', syncing: 'Sincronizando…', pending: 'Enviando alterações…', offline: 'Sem internet (sincroniza ao voltar)', error: 'Erro' }[Cloud.status];
  body.innerHTML = `<div class="grid g4">
      ${kpi('database', 'Registros salvos', fmt.num(total), 'em todas as áreas do sistema')}
      ${kpi('hard-drive', 'Banco local', Store.mode === 'idb' ? 'IndexedDB' : 'Básico', Store.mode === 'idb' ? 'armazenamento robusto do navegador' : 'navegador sem IndexedDB')}
      ${kpi('shield-check', 'Proteção contra limpeza', Store.persistent ? 'Ativa' : 'Padrão', Store.persistent ? 'o navegador não apaga os dados sozinho' : 'ative a nuvem para total segurança')}
      ${kpi('cloud', 'Nuvem', Cloud.user ? 'Conectada' : 'Desligada', cloudTxt)}</div>
    <div class="grid g-side mt"><div class="card"><h3>${ico('table')}O que está guardado</h3><table class="table"><thead><tr><th>Área</th><th style="text-align:right">Registros</th></tr></thead><tbody>
      ${Object.entries(COLLECTION_NAMES).map(([k, n]) => `<tr><td>${n}</td><td style="text-align:right"><strong>${fmt.num(counts[k] || 0)}</strong></td></tr>`).join('')}
      <tr><td>Perfis das marcas, rotina e configurações</td><td style="text-align:right"><strong>✓</strong></td></tr></tbody></table></div>
      <div class="grid" style="align-content:start"><div class="card"><h3>${ico('gauge')}Espaço</h3><div id="dbUsage" class="small muted">Calculando…</div></div>
      <div class="card"><h3>${ico('layers')}Como seus dados ficam protegidos</h3><div class="steps small">
        <div class="step"><strong>Gravação imediata</strong> no banco local (IndexedDB) a cada alteração, com cópia espelho de segurança.</div>
        <div class="step"><strong>Cópias automáticas</strong> ao abrir o sistema e a cada 30 minutos (as ${MAX_SNAPSHOTS} últimas versões ficam guardadas).</div>
        <div class="step"><strong>Nuvem (PostgreSQL / Supabase)</strong>: com login, tudo é sincronizado e fica disponível em qualquer computador. ${Cloud.user ? '<span class="badge ok">ativa</span>' : '<a href="#/backup" data-tab="cloud" data-tabkey="dbTab">configurar</a>'}</div>
        <div class="step"><strong>Backup em arquivo</strong> quando você quiser, para guardar no Drive.</div></div></div></div></div>`;
  const u = await Store.usage(), box = $('#dbUsage', body);
  if (box) box.innerHTML = u ? `Usando <strong>${fmtBytes(u.usage)}</strong> de ${fmtBytes(u.quota)} disponíveis neste navegador.<div class="progress mt-s"><div style="width:${clamp(u.usage / u.quota * 100, 1, 100)}%"></div></div><p class="muted small">Última gravação: ${fmtWhen(Store.lastSaved || state._savedAt)}</p>` : 'Informação indisponível neste navegador.';
}

function dbCloud(body) {
  const c = Cloud.conf();
  if (!Cloud.configured()) {
    body.innerHTML = `<div class="grid g2"><div class="card"><h3>${ico('cloud')}Ligar o banco na nuvem</h3>
      <p class="small">Com a nuvem, tudo que você salva vai para um banco PostgreSQL seu (Supabase, plano gratuito), protegido por login. Seus dados aparecem em qualquer computador e não se perdem se o navegador for limpo.</p>
      <div class="steps small">
        <div class="step">Crie uma conta grátis em <a href="https://supabase.com/dashboard" target="_blank">supabase.com</a> e clique em <strong>New project</strong> (anote a senha do banco).</div>
        <div class="step">No projeto, abra <strong>SQL Editor</strong> → <strong>New query</strong>, cole o script ao lado e clique em <strong>Run</strong>.</div>
        <div class="step">Vá em <strong>Project Settings → API</strong> e copie a <strong>Project URL</strong> e a chave <strong>anon public</strong>.</div>
        <div class="step">Clique em <strong>Conectar</strong> abaixo, cole os dois valores e crie seu login.</div></div>
      <button class="btn primary mt" id="cConnect">${ico('plug')}Conectar ao Supabase</button>
      <div class="tip small mt">Dica: em <strong>Authentication → Sign In / Providers → Email</strong>, desligue “Confirm email” para entrar sem precisar confirmar o e-mail.</div></div>
      <div class="card"><div class="card-head"><h3>${ico('code')}Script SQL (cole no SQL Editor)</h3><span class="sp"></span><button class="btn sm" id="cSql">${ico('copy')}Copiar script</button></div><pre class="out small" style="max-height:440px;overflow:auto">${esc(CLOUD_SQL)}</pre></div></div>`;
    $('#cSql', body).onclick = () => copy(CLOUD_SQL);
    $('#cConnect', body).onclick = () => connectModal();
    return;
  }
  if (!Cloud.user) {
    body.innerHTML = `<div class="card" style="max-width:620px"><h3>${ico('log-in')}Entrar na nuvem</h3><p class="small">Projeto conectado: <code>${esc(c.url)}</code></p>
      <p class="small muted">Entre com seu e-mail e senha. Se for a primeira vez, clique em “Criar conta”. Os dados deste computador são enviados para a nuvem e juntados com o que já estiver lá.</p>
      <div class="row"><button class="btn primary" id="cLogin">${ico('log-in')}Entrar</button><button class="btn" id="cSignup">${ico('user-plus')}Criar conta</button><span class="sp"></span><button class="btn ghost" id="cEdit">${ico('settings')}Trocar projeto</button></div>
      ${Cloud.error ? `<div class="tip warn small mt">${esc(Cloud.error)}</div>` : ''}</div>`;
    $('#cLogin', body).onclick = () => authModal('login');
    $('#cSignup', body).onclick = () => authModal('signup');
    $('#cEdit', body).onclick = () => connectModal();
    return;
  }
  const st = { ok: ['ok', 'Tudo sincronizado'], syncing: ['info', 'Sincronizando…'], pending: ['info', 'Enviando alterações…'], offline: ['warn', 'Sem internet — sincroniza ao voltar'], error: ['bad', 'Erro na sincronização'] }[Cloud.status] || ['', Cloud.status];
  body.innerHTML = `<div class="grid g-side"><div class="card"><h3>${ico('cloud')}Nuvem conectada</h3>
      <div class="list"><div class="li"><span class="grow">Status</span><span class="badge ${st[0]}">${st[1]}</span></div>
      <div class="li"><span class="grow">Usuário</span><strong>${esc(Cloud.user.email || '')}</strong></div>
      <div class="li"><span class="grow">Última sincronização</span><strong>${fmtWhen(Cloud.lastSync)}</strong></div>
      <div class="li"><span class="grow">Registros na nuvem</span><strong id="cCount">…</strong></div>
      <div class="li"><span class="grow">Projeto</span><code class="small">${esc(c.url)}</code></div></div>
      ${Cloud.error ? `<div class="tip warn small mt">${esc(Cloud.error)}</div>` : ''}
      <div class="row mt"><button class="btn primary" id="cSync">${ico('refresh-cw')}Sincronizar agora</button><button class="btn" id="cForce">${ico('upload-cloud')}Reenviar tudo</button><span class="sp"></span><button class="btn ghost" id="cOut">${ico('log-out')}Sair</button></div></div>
      <div class="card"><h3>${ico('info')}Como funciona</h3><ul class="small">
        <li>Cada alteração é enviada para a nuvem em ~2 segundos.</li><li>A cada minuto (e quando você volta para a aba) o sistema busca alterações feitas em outros computadores.</li>
        <li>Sem internet, tudo continua salvo no computador e é enviado quando a conexão voltar.</li><li>Se o mesmo item for editado em dois lugares, vale a edição mais recente.</li>
        <li>Tokens do Instagram e a chave da IA <strong>não</strong> vão para a nuvem — ficam só neste navegador.</li></ul></div></div>`;
  $('#cSync', body).onclick = () => Cloud.sync();
  $('#cForce', body).onclick = () => confirmBox('Reenviar todos os registros deste computador para a nuvem e baixar tudo de novo? Útil se algo parecer fora de sincronia.', () => Cloud.sync(true), { yes: 'Reenviar tudo' });
  $('#cOut', body).onclick = () => confirmBox('Sair da nuvem neste computador? Os dados continuam salvos aqui e na nuvem.', () => Cloud.signOut(), { yes: 'Sair' });
  Cloud.remoteCount().then(n => { const e = $('#cCount', body); if (e) e.textContent = fmt.num(n); }).catch(e => { const x = $('#cCount', body); if (x) x.textContent = '—'; });
}

function connectModal() {
  const c = Cloud.conf();
  modal({ title: 'Conectar ao Supabase', saveLabel: 'Conectar',
    body: `${F.text('url', 'Project URL', c.url || '', 'placeholder="https://xxxxxxxx.supabase.co"')}${F.area('key', 'Chave anon public', c.key || '', 3, 'placeholder="eyJhbGciOi..."')}
      <p class="small muted">A chave <em>anon</em> é pública por natureza: a segurança vem do login e das regras do script SQL (cada usuário só acessa os próprios dados). Nunca cole aqui a chave <em>service_role</em>.</p>${c.url ? `<button type="button" class="btn sm danger" id="cDisc">Desconectar este projeto</button>` : ''}`,
    onOpen: (f, w, close) => { const d = $('#cDisc', w); if (d) d.onclick = () => { localStorage.removeItem(CLOUD_KEY); Cloud.client = null; Cloud.user = null; Cloud.set('off'); close(); App.render(); }; },
    onSave: d => {
      const url = d.url.trim().replace(/\/+$/, ''), key = d.key.trim();
      if (!/^https:\/\/.+/.test(url) || key.length < 30) { toast('Confira a URL e a chave'); return false; }
      if (/service_role/.test(atobSafe(key.split('.')[1] || ''))) { toast('Essa é a chave service_role — use a chave anon public'); return false; }
      Cloud.setConf({ url, key });
      const wait = modal({ title: 'Conectando…', body: `<div class="empty">${ico('loader')}Testando a conexão com o Supabase…</div>` });
      Cloud.init().then(async () => {
        wait.close();
        if (!Cloud.client) throw new Error(Cloud.error || 'Falha ao conectar');
        const { error } = await Cloud.client.from('records').select('id', { head: true, count: 'exact' }).limit(1);
        if (error && /does not exist|Could not find/i.test(error.message)) { modal({ title: 'Falta criar a tabela', body: `<div class="tip warn">Conectou, mas a tabela <strong>records</strong> ainda não existe. Rode o script SQL no SQL Editor do Supabase e tente de novo.</div>`, extraBtns: `<button type="button" class="btn primary" data-cp>${ico('copy')}Copiar script</button>`, onOpen: (f, w) => { $('[data-cp]', w).onclick = () => copy(CLOUD_SQL); } }); App.render(); return; }
        App.render(); authModal(Cloud.user ? null : 'signup');
      }).catch(e => { wait.close(); modal({ title: 'Não foi possível conectar', body: `<div class="tip warn">${esc(e.message)}</div><p class="small muted">Confira se copiou a Project URL e a chave anon corretas.</p>` }); });
    } });
}
function atobSafe(s) { try { return atob(s.replace(/-/g, '+').replace(/_/g, '/')); } catch (e) { return ''; } }

function authModal(mode) {
  if (!mode) return;
  const isUp = mode === 'signup';
  modal({ title: isUp ? 'Criar conta na nuvem' : 'Entrar na nuvem', saveLabel: isUp ? 'Criar conta' : 'Entrar',
    body: `${F.text('email', 'E-mail', '', 'type="email" autocomplete="username"')}${F.text('pass', 'Senha (mínimo 6 caracteres)', '', 'type="password" autocomplete="' + (isUp ? 'new-password' : 'current-password') + '"')}
      <p class="small muted">${isUp ? 'Já tem conta?' : 'Primeira vez?'} <a href="#" id="aSwitch">${isUp ? 'Entrar' : 'Criar conta'}</a></p>`,
    onOpen: (f, w, close) => { $('#aSwitch', w).onclick = e => { e.preventDefault(); close(); authModal(isUp ? 'login' : 'signup'); }; },
    onSave: (d, f, w) => {
      if (!d.email.includes('@') || d.pass.length < 6) { toast('Informe e-mail e senha (6+ caracteres)'); return false; }
      const btn = $('[data-save]', w); btn.disabled = true; btn.textContent = 'Aguarde…';
      (isUp ? Cloud.signUp(d.email, d.pass) : Cloud.signIn(d.email, d.pass)).then(res => {
        w.remove();
        if (isUp && !res?.session) { modal({ title: 'Confirme seu e-mail', body: `<p>Enviamos um link de confirmação para <strong>${esc(d.email)}</strong>. Clique nele e depois volte aqui e use <strong>Entrar</strong>.</p><p class="small muted">Para não precisar confirmar, desligue “Confirm email” em Authentication → Providers → Email no Supabase.</p>` }); return; }
        modal({ title: 'Nuvem ativada ✅', body: `<p>Você entrou como <strong>${esc(d.email)}</strong>. Seus ${fmt.num(totalRecords())} registros deste computador estão sendo enviados para a nuvem, e o que já existir lá será trazido para cá.</p><p class="small muted">Em outro computador, abra o site, conecte o mesmo projeto e entre com o mesmo e-mail.</p>` });
        state.ui.dbTab = 'cloud'; App.render();
      }).catch(e => { btn.disabled = false; btn.textContent = isUp ? 'Criar conta' : 'Entrar'; toast('Erro: ' + (e.message === 'Invalid login credentials' ? 'e-mail ou senha incorretos' : e.message)); });
      return false;
    } });
}

async function dbSnaps(body) {
  body.innerHTML = `<div class="row mb"><span class="muted small">O sistema guarda uma cópia ao abrir e a cada 30 minutos, mantendo as ${MAX_SNAPSHOTS} mais recentes. Também guarda uma cópia antes de qualquer restauração ou importação.</span><span class="sp"></span><button class="btn primary" id="sNew">${ico('save')}Criar cópia agora</button></div><div class="card" id="sList">${emptyState('Carregando…', 'history')}</div>`;
  $('#sNew', body).onclick = () => promptBox('Criar cópia de segurança', 'Descrição da cópia', 'Cópia manual — ' + fmtWhen(new Date()), async n => { await Store.snapshot(n, false); toast('Cópia criada'); App.render(); }, { saveLabel: 'Criar cópia' });
  const list = await Store.snapshots(), box = $('#sList', body); if (!box) return;
  box.innerHTML = list.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Data</th><th>Motivo</th><th>Registros</th><th>Tamanho</th><th></th></tr></thead><tbody>${list.map(s => `<tr><td><strong>${fmtWhen(s.ts)}</strong></td><td>${esc(s.reason)}</td><td>${fmt.num(s.total)}</td><td>${fmtBytes(s.size)}</td>
    <td style="text-align:right;white-space:nowrap"><button class="btn xs" data-see="${s.id}">${ico('eye')}Ver</button> <button class="btn xs" data-dl="${s.id}">${ico('download')}Baixar</button> <button class="btn xs primary" data-rs="${s.id}">${ico('rotate-ccw')}Restaurar</button></td></tr>`).join('')}</tbody></table></div>`
    : emptyState(Store.mode === 'idb' ? 'Nenhuma cópia ainda.' : 'Este navegador não suporta cópias automáticas.', 'history');
  $$('[data-see]', box).forEach(b => b.onclick = () => { const s = list.find(x => x.id === +b.dataset.see); modal({ title: 'Cópia de ' + fmtWhen(s.ts), body: `<p class="small muted">${esc(s.reason)}</p><table class="table">${Object.entries(COLLECTION_NAMES).map(([k, n]) => `<tr><td>${n}</td><td style="text-align:right">${fmt.num(s.counts?.[k] || 0)}</td><td style="text-align:right" class="muted small">agora: ${fmt.num(stateCounts()[k] || 0)}</td></tr>`).join('')}</table>` }); });
  $$('[data-dl]', box).forEach(b => b.onclick = async () => { const s = await Store.getSnapshot(+b.dataset.dl); download(`copia-central-marketing-${s.ts.slice(0, 16).replace(/[:T]/g, '-')}.json`, JSON.stringify(s.data, null, 1)); });
  $$('[data-rs]', box).forEach(b => b.onclick = () => { const s = list.find(x => x.id === +b.dataset.rs);
    confirmBox(`Restaurar a cópia de <strong>${fmtWhen(s.ts)}</strong> (${fmt.num(s.total)} registros)? O estado atual será guardado antes como uma nova cópia.${Cloud.user ? ' A nuvem também será atualizada.' : ''}`, async () => { const full = await Store.getSnapshot(s.id); await Store.replaceAll(full.data, 'restaurar cópia de ' + fmtWhen(s.ts)); modal({ title: 'Cópia restaurada ✅', body: `<p>Os dados voltaram para ${fmtWhen(s.ts)}.</p>` }); }, { yes: 'Restaurar' }); });
}

function dbIO(body) {
  body.innerHTML = `<div class="grid g2"><div class="card"><h3>${ico('download')}Exportar</h3><p class="small">Baixa um arquivo com tudo: posts, roteiros, funis, leads, métricas e configurações. Guarde no Google Drive ou OneDrive.</p>
      <label class="chk"><input type="checkbox" id="noSecrets" checked> Não incluir tokens e chaves de API</label><button class="btn primary mt-s" id="bExp">${ico('download')}Baixar backup completo</button></div>
    <div class="card"><h3>${ico('upload')}Importar</h3><p class="small">Restaura um arquivo de backup (substitui os dados atuais — antes é criada uma cópia automática).</p><input type="file" id="bFile" accept=".json"><hr>
      <h3>${ico('trash-2')}Apagar tudo</h3><p class="small muted">Remove todos os dados deste sistema${Cloud.user ? ' <strong>e da nuvem</strong>' : ''}. Uma cópia automática é guardada antes.</p><button class="btn danger" id="bReset">Apagar todos os dados</button></div></div>`;
  $('#bExp', body).onclick = () => { const s = JSON.parse(JSON.stringify(state)); s.ui = {}; if ($('#noSecrets', body).checked) { Object.values(s.ig || {}).forEach(c => delete c.token); if (s.settings) delete s.settings.aiKey; } download(`backup-central-marketing-${today()}.json`, JSON.stringify(s, null, 1)); modal({ title: 'Backup baixado ✅', body: `<p>O arquivo com ${fmt.num(totalRecords())} registros foi salvo na sua pasta de Downloads. Guarde-o no Drive.</p>` }); };
  $('#bFile', body).onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { const s = JSON.parse(r.result); if (!s.col) throw new Error('arquivo inválido — não é um backup da Central'); confirmBox(`Importar este backup com <strong>${fmt.num(totalRecords(s))} registros</strong>? Os dados atuais (${fmt.num(totalRecords())} registros) serão substituídos — antes guardamos uma cópia automática.`, async () => { await Store.replaceAll(s, 'importar arquivo ' + f.name); modal({ title: 'Backup importado ✅', body: `<p>${fmt.num(totalRecords())} registros carregados.</p>` }); }, { yes: 'Importar', danger: true }); } catch (err) { modal({ title: 'Arquivo inválido', body: `<div class="tip warn">${esc(err.message)}</div>` }); } }; r.readAsText(f); };
  $('#bReset', body).onclick = () => confirmBox(`Apagar <strong>TODOS</strong> os ${fmt.num(totalRecords())} registros${Cloud.user ? ' deste sistema e da nuvem' : ''}? Uma cópia automática será guardada antes (aba Cópias automáticas).`, () => setTimeout(() => confirmBox('Tem certeza absoluta?', async () => { await Store.replaceAll({ ...defaults(), settings: state.settings }, 'apagar todos os dados'); toast('Dados apagados'); }, { yes: 'Sim, apagar tudo', danger: true }), 50), { yes: 'Apagar tudo', danger: true });
}
