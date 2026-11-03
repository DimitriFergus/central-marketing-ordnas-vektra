/* ===== Tráfego & Instagram ===== */

/* ---------- Instagram (API da Meta) ---------- */
async function igFetch(b, path, params = {}) {
  const c = state.ig[b];
  const u = new URL(`https://graph.facebook.com/${c.version || 'v24.0'}/${path}`);
  Object.entries({ ...params, access_token: c.token }).forEach(([k, v]) => u.searchParams.set(k, v));
  const r = await fetch(u); const j = await r.json();
  if (j.error) throw new Error(j.error.message);
  return j;
}
const IG_FMT = { REELS: 'Reels', CAROUSEL_ALBUM: 'Carrossel', IMAGE: 'Post estático', VIDEO: 'Reels' };
async function igSync(b, onStep = () => { }) {
  const c = state.ig[b];
  onStep('Lendo perfil…');
  c.profile = await igFetch(b, c.igId, { fields: 'username,name,followers_count,follows_count,media_count,profile_picture_url,biography' });
  onStep('Lendo publicações…');
  const media = (await igFetch(b, `${c.igId}/media`, { fields: 'id,caption,media_type,media_product_type,timestamp,like_count,comments_count,permalink,thumbnail_url,media_url', limit: 50 })).data || [];
  const out = [];
  for (let i = 0; i < media.length; i++) {
    const m = media[i]; onStep(`Métricas ${i + 1}/${media.length}…`);
    const ins = {};
    for (const metrics of ['reach,saved,shares,total_interactions,views', 'reach,saved,shares', 'reach']) {
      try { const r = await igFetch(b, `${m.id}/insights`, { metric: metrics }); (r.data || []).forEach(x => ins[x.name] = x.values?.[0]?.value ?? x.total_value?.value ?? 0); break; } catch (e) { /* tenta métricas mais simples */ }
    }
    const dt = new Date(m.timestamp);
    out.push({ brand: b, source: 'api', igid: m.id, date: ymd(dt), hour: dt.getHours(), format: m.media_product_type === 'REELS' ? 'Reels' : (IG_FMT[m.media_type] || 'Post estático'),
      caption: m.caption || '', likes: m.like_count || 0, comments: m.comments_count || 0, saves: ins.saved || 0, shares: ins.shares || 0, reach: ins.reach || 0, views: ins.views || 0, permalink: m.permalink, thumb: m.thumbnail_url || (m.media_type !== 'VIDEO' ? m.media_url : '') });
  }
  state.col.igposts = DB.raw('igposts').filter(p => !(p.brand === b && p.source === 'api'));
  out.forEach(p => DB.add('igposts', p));
  c.lastSync = new Date().toISOString(); save();
  return out.length;
}

function postScore(p) { return num(p.likes) + num(p.comments) * 2 + num(p.saves) * 3 + num(p.shares) * 3; }
function engRate(p, followers) { const base = num(p.reach) || num(followers); return base ? (num(p.likes) + num(p.comments) + num(p.saves) + num(p.shares)) / base * 100 : 0; }

function igAnalysis(posts, followers) {
  if (!posts.length) return null;
  const byFmt = {}, byDay = {}, byHour = {};
  posts.forEach(p => {
    const s = postScore(p), e = engRate(p, followers);
    (byFmt[p.format] ||= []).push({ s, e, r: num(p.reach) });
    (byDay[parseYMD(p.date).getDay()] ||= []).push(s);
    if (p.hour !== '' && p.hour !== undefined) (byHour[Math.floor(num(p.hour) / 3) * 3] ||= []).push(s);
  });
  const fmtStats = Object.entries(byFmt).map(([k, a]) => ({ label: k, value: avg(a, x => x.e), reach: avg(a, x => x.r), score: avg(a, x => x.s), n: a.length, color: FORMAT_COLORS[k] })).sort((a, b) => b.score - a.score);
  const dayStats = Object.entries(byDay).map(([k, a]) => ({ label: WEEKDAYS[k], value: avg(a), n: a.length })).sort((a, b) => b.value - a.value);
  const hourStats = Object.entries(byHour).map(([k, a]) => ({ label: `${String(k).padStart(2, '0')}h–${String(+k + 3).padStart(2, '0')}h`, value: avg(a), n: a.length })).sort((a, b) => b.value - a.value);
  const sorted = [...posts].sort((a, b) => postScore(b) - postScore(a));
  const top = sorted.slice(0, Math.max(1, Math.ceil(posts.length / 4)));
  const stop = new Set('para com que uma não mais como sua seu você pra por isso esse essa este esta dos das nos nas aos sobre quem tem ser são está muito também pode cada mas sem quando onde qual aqui link bio salve siga comente'.split(' '));
  const words = {};
  top.forEach(p => (p.caption || '').toLowerCase().replace(/#\w+/g, '').match(/[a-záéíóúâêôãõç]{5,}/g)?.forEach(w => { if (!stop.has(w)) words[w] = (words[w] || 0) + 1; }));
  const keywords = Object.entries(words).sort((a, b) => b[1] - a[1]).slice(0, 12).map(x => x[0]);
  const dates = posts.map(p => p.date).sort();
  const weeks = Math.max(1, (parseYMD(dates[dates.length - 1]) - parseYMD(dates[0])) / 6048e5);
  const perWeek = posts.length / weeks;
  const avgEng = avg(posts, p => engRate(p, followers));
  const saveRatio = sum(posts, p => p.saves) / Math.max(1, sum(posts, p => p.likes));
  const capLen = { short: avg(posts.filter(p => (p.caption || '').length < 300), postScore), long: avg(posts.filter(p => (p.caption || '').length >= 300), postScore) };
  let health = 0;
  health += clamp(perWeek / 4, 0, 1) * 30;
  health += clamp(avgEng / 5, 0, 1) * 30;
  health += clamp(Object.keys(byFmt).length / 3, 0, 1) * 15;
  health += clamp(saveRatio / .1, 0, 1) * 25;
  const recs = [];
  if (fmtStats[0]) recs.push(`🎯 <strong>${fmtStats[0].label}</strong> é o seu formato com melhor resultado (pontuação média ${fmt.num(fmtStats[0].score)}). Aumente a participação dele no calendário.`);
  if (fmtStats.length > 1) { const w = fmtStats[fmtStats.length - 1]; recs.push(`📉 <strong>${w.label}</strong> está performando abaixo. Teste novos ganchos/capas antes de abandonar o formato.`); }
  if (dayStats[0]) recs.push(`📅 Melhor dia para postar: <strong>${dayStats[0].label}</strong>${dayStats[1] ? ` (seguido de ${dayStats[1].label})` : ''}.`);
  if (hourStats[0]) recs.push(`⏰ Melhor faixa de horário: <strong>${hourStats[0].label}</strong>. Agende os posts principais nela.`);
  recs.push(perWeek < 3 ? `🔁 Frequência atual: ${fmt.num(perWeek, 1)} posts/semana. O ideal para crescer é 4 a 5 posts no feed por semana.` : `🔁 Boa frequência: ${fmt.num(perWeek, 1)} posts/semana. Mantenha a consistência.`);
  recs.push(saveRatio < .05 ? '💾 Poucos salvamentos em relação a curtidas: crie mais carrosséis "salváveis" (checklists, passo a passo, calendários fiscais).' : '💾 Ótima taxa de salvamentos — seu conteúdo é visto como útil. Use isso nos anúncios.');
  if (capLen.short && capLen.long) recs.push(capLen.long > capLen.short ? '✍️ Legendas longas (300+ caracteres) engajam mais no seu perfil. Use storytelling.' : '✍️ Legendas curtas funcionam melhor no seu perfil. Vá direto ao ponto e use a primeira linha como gancho.');
  if (keywords.length) recs.push(`🔑 Palavras que aparecem nos posts de melhor desempenho: <em>${keywords.slice(0, 8).join(', ')}</em>. Repita esses temas.`);
  return { fmtStats, dayStats, hourStats, top: sorted.slice(0, 6), keywords, perWeek, avgEng, saveRatio, health: Math.round(health), recs, total: posts.length };
}

view('instagram', {
  title: 'Instagram conectado', icon: 'camera', sub: 'Conecte, analise e receba recomendações',
  render(el) {
    const b = genBrand();
    const c = state.ig[b] ||= { version: 'v24.0' };
    const tb = tabs('igTab', [['an', 'Análise & recomendações'], ['conn', 'Conexão com a Meta'], ['manual', 'Lançar métricas manualmente']], c.token ? 'an' : 'conn');
    el.innerHTML = (genBrandPicker() ? `<div style="max-width:320px">${genBrandPicker()}</div>` : '') + tb.html + '<div id="igBody"></div>';
    const body = $('#igBody', el);
    const posts = DB.raw('igposts').filter(p => p.brand === b).sort((x, y) => y.date.localeCompare(x.date));

    if (tb.cur === 'conn') {
      body.innerHTML = `<div class="grid g2"><div class="card"><h3>${ico('plug')}Conectar ${BRANDS[b].full}</h3>
        ${c.profile ? `<div class="tip ok mb">✅ Conectado como <strong>@${esc(c.profile.username)}</strong> · ${fmt.num(c.profile.followers_count)} seguidores · última sincronização ${c.lastSync ? new Date(c.lastSync).toLocaleString('pt-BR') : '—'}</div>` : ''}
        <form id="igForm">${F.area('token', 'Token de acesso (Meta Graph API)', c.token || '', 3, 'placeholder="EAAG..."')}
        <div class="form-row">${F.text('igId', 'ID da conta Instagram Business', c.igId || '')}${F.text('version', 'Versão da API', c.version || 'v24.0')}</div></form>
        <div class="row"><button class="btn" id="igAcc">${ico('search')}Buscar minhas contas</button><button class="btn primary" id="igSync">${ico('refresh-cw')}Salvar e sincronizar</button>${c.token ? `<button class="btn danger" id="igOff">Desconectar</button>` : ''}</div>
        
        <p class="muted small mt">🔒 O token fica salvo apenas neste navegador, no seu computador. Nada é enviado para outro servidor além da própria Meta.</p></div>
        <div class="card"><h3>${ico('book-open')}Como conseguir o token (5 minutos)</h3><div class="steps small">
          <div class="step">A conta do Instagram precisa ser <strong>Profissional (Empresa ou Criador)</strong> e estar vinculada a uma <strong>Página do Facebook</strong>.</div>
          <div class="step">Acesse <a href="https://developers.facebook.com/apps" target="_blank">developers.facebook.com/apps</a> e crie um app do tipo <strong>Empresa</strong>.</div>
          <div class="step">Abra o <a href="https://developers.facebook.com/tools/explorer" target="_blank">Graph API Explorer</a>, selecione seu app e adicione as permissões: <code>instagram_basic</code>, <code>instagram_manage_insights</code>, <code>pages_show_list</code>, <code>pages_read_engagement</code>, <code>business_management</code>.</div>
          <div class="step">Clique em <strong>Generate Access Token</strong>, autorize e copie o token.</div>
          <div class="step">Para durar ~60 dias, use o <a href="https://developers.facebook.com/tools/debug/accesstoken" target="_blank">Depurador de token</a> → <strong>Extend Access Token</strong>.</div>
          <div class="step">Cole aqui, clique em <strong>Buscar minhas contas</strong>, escolha a conta e sincronize.</div></div>
          <div class="tip warn small">Sem token? Use a aba <strong>Lançar métricas manualmente</strong> — a análise funciona igual.</div></div></div>`;
      const keep = () => { Object.assign(c, formData($('#igForm', body))); c.token = c.token.trim(); save(); };
      $('#igAcc', body).onclick = async () => {
        keep(); if (!c.token) { modal({ title: 'Falta o token', body: '<div class="tip warn">Cole o token de acesso da Meta no campo “Token de acesso” e tente de novo.</div>' }); return; }
        const w = modal({ title: 'Escolha a conta do Instagram', body: `<div id="accList" class="empty">${ico('loader')}Buscando suas contas na Meta…</div>` });
        try {
          const r = await igFetch(b, 'me/accounts', { fields: 'name,instagram_business_account{id,username,followers_count}' });
          const accs = (r.data || []).filter(p => p.instagram_business_account);
          const box = $('#accList', w.el); box.className = 'list';
          if (!accs.length) { box.innerHTML = '<div class="tip warn">Nenhuma conta do Instagram Business vinculada às suas páginas. Confira se o Instagram é Profissional e está ligado a uma Página do Facebook.</div>'; return; }
          box.innerHTML = accs.map(p => `<div class="li"><div class="grow"><strong>@${esc(p.instagram_business_account.username)}</strong> <span class="muted">(${esc(p.name)}) · ${fmt.num(p.instagram_business_account.followers_count)} seguidores</span></div><button type="button" class="btn xs primary" data-pick="${p.instagram_business_account.id}">Usar esta</button></div>`).join('');
          $$('[data-pick]', w.el).forEach(x => x.onclick = () => { $('[name=igId]', body).value = x.dataset.pick; keep(); w.close(); toast('Conta selecionada. Agora clique em “Salvar e sincronizar”.'); });
        } catch (e) { $('#accList', w.el).outerHTML = `<div class="tip warn">Erro da Meta: ${esc(e.message)}</div>`; }
      };
      $('#igSync', body).onclick = async () => {
        keep(); if (!c.token || !c.igId) { modal({ title: 'Faltam dados', body: '<div class="tip warn">Informe o token e o ID da conta (use “Buscar minhas contas”).</div>' }); return; }
        const w = modal({ title: 'Sincronizando Instagram', body: `<div class="empty">${ico('loader')}<div id="syncMsg">Conectando…</div></div>` });
        try { const n = await igSync(b, t => { const m = $('#syncMsg', w.el); if (m) m.textContent = t; }); w.close(); state.ui.igTab = 'an'; App.render(); modal({ title: 'Instagram sincronizado ✅', body: `<p>${n} publicações de <strong>@${esc(c.profile.username)}</strong> foram analisadas. Veja as recomendações na aba “Análise & recomendações”.</p>` }); }
        catch (e) { w.close(); modal({ title: 'Não foi possível sincronizar', body: `<div class="tip warn">${esc(e.message)}</div><p class="small muted">Tokens expiram: gere um novo e use “Extend Access Token” para durar 60 dias.</p>` }); }
      };
      const off = $('#igOff', body); if (off) off.onclick = () => confirmBox('Desconectar o Instagram e apagar o token deste navegador?', () => { state.ig[b] = { version: c.version }; save(); App.render(); }, { danger: true, yes: 'Desconectar' });
      return;
    }

    if (tb.cur === 'manual') {
      body.innerHTML = `<div class="row mb"><span class="muted small">Sem conexão com a Meta? Lance os números de cada post e a análise funciona igual.</span><span class="sp"></span><button class="btn primary" id="mNewIg">${ico('plus')}Registrar post</button></div>
        <div class="card"><h3>${ico('table')}Posts registrados (${posts.length})</h3><div class="table-wrap"><table class="table"><thead><tr><th>Data</th><th>Formato</th><th>Tema</th><th>Alcance</th><th>Curt.</th><th>Com.</th><th>Salv.</th><th>Comp.</th><th>Eng.</th><th></th></tr></thead><tbody>
        ${posts.map(p => `<tr><td>${fmt.date(p.date)}</td><td>${esc(p.format)}</td><td>${esc((p.caption || '').slice(0, 50))}</td><td>${fmt.num(p.reach)}</td><td>${fmt.num(p.likes)}</td><td>${fmt.num(p.comments)}</td><td>${fmt.num(p.saves)}</td><td>${fmt.num(p.shares)}</td><td>${fmt.pct(engRate(p, c.profile?.followers_count))}</td><td>${p.source === 'api' ? '<span class="badge info">API</span>' : `<button class="btn xs" data-edig="${p.id}">${ico('pencil')}</button>`}</td></tr>`).join('') || '<tr><td colspan="10" class="muted">Nenhum post registrado.</td></tr>'}</tbody></table></div></div>`;
      const editIg = (p = {}) => modal({ title: p.id ? 'Editar métricas do post' : 'Registrar desempenho de um post', size: 'wide', saveLabel: p.id ? 'Salvar' : 'Registrar',
        body: `<div class="form-row">${F.date('date', 'Data', p.date || today())}${F.num('hour', 'Hora (0-23)', p.hour ?? 12)}${F.select('format', 'Formato', FORMATS.slice(0, 4), p.format)}</div>${F.text('caption', 'Tema / início da legenda', p.caption)}
          <div class="form-row">${F.num('reach', 'Alcance', p.reach)}${F.num('likes', 'Curtidas', p.likes)}${F.num('comments', 'Comentários', p.comments)}${F.num('saves', 'Salvamentos', p.saves)}${F.num('shares', 'Compartilhamentos', p.shares)}</div>`,
        onSave: d => { if (p.id) DB.update('igposts', p.id, d); else DB.add('igposts', { ...d, brand: b, source: 'manual' }); toast('Métricas registradas'); App.render(); },
        onDelete: p.id ? () => { DB.remove('igposts', p.id); App.render(); } : null });
      $('#mNewIg', body).onclick = () => editIg();
      $$('[data-edig]', body).forEach(x => x.onclick = () => editIg(DB.get('igposts', x.dataset.edig)));
      return;
    }

    const a = igAnalysis(posts, c.profile?.followers_count);
    if (!a) { body.innerHTML = `<div class="card">${emptyState('Ainda não há dados. Conecte o Instagram na aba “Conexão com a Meta” ou lance métricas manualmente.', 'camera')}</div>`; return; }
    body.innerHTML = `<div class="grid g4">
        <div class="card kpi"><div class="row"><div class="score" style="--p:${a.health}"><span>${a.health}</span></div><div><div class="lbl">Saúde do perfil</div><div class="sub">${a.health >= 70 ? 'Ótimo' : a.health >= 45 ? 'Bom, com ajustes' : 'Precisa de atenção'}</div></div></div></div>
        ${kpi('users', 'Seguidores', c.profile ? fmt.num(c.profile.followers_count) : '—', c.profile ? '@' + esc(c.profile.username) : 'Dados manuais')}
        ${kpi('activity', 'Engajamento médio', fmt.pct(a.avgEng, 2), `${a.total} posts analisados`)}
        ${kpi('repeat', 'Frequência', fmt.num(a.perWeek, 1) + '/sem', 'posts no feed')}
      </div>
      <div class="grid g-side mt"><div class="grid" style="align-content:start">
        <div class="card"><div class="card-head"><h3>${ico('lightbulb')}Recomendações para os próximos posts</h3>${c.token ? `<span class="sp"></span><button class="btn sm" id="igResync">${ico('refresh-cw')}Sincronizar</button>` : ''}</div><div class="list">${a.recs.map(r => `<div class="li small txt">${r}</div>`).join('')}</div>
          <div class="row mt">${aiButtons('ig')}</div><div id="igAI"></div></div>
        <div class="card"><h3>${ico('flame')}Melhores posts — candidatos a impulsionar</h3><div class="ig-grid">${a.top.map(p => `<a class="ig-post" ${p.permalink ? `href="${esc(p.permalink)}" target="_blank"` : ''}><div class="img" style="${p.thumb ? `background-image:url('${esc(p.thumb)}')` : ''}">${p.thumb ? '' : esc(p.format)}</div><div class="meta"><span>❤ ${fmt.num(p.likes)}</span><span>💬 ${fmt.num(p.comments)}</span><span>💾 ${fmt.num(p.saves)}</span><span>↗ ${fmt.num(p.shares)}</span></div><div class="meta muted">${fmt.date(p.date)} · ${esc(p.format)}</div></a>`).join('')}</div>
          <div class="tip small mt">Posts com muitos <strong>salvamentos e compartilhamentos</strong> são os melhores para impulsionar: o algoritmo já provou que o conteúdo é relevante. Veja a estratégia em <a href="#/ads">Tráfego pago</a>.</div></div>
      </div><div class="grid" style="align-content:start">
        <div class="card"><h3>${ico('layers')}Desempenho por formato</h3>${hbars(a.fmtStats.map(x => ({ label: `${x.label} (${x.n})`, value: x.score, color: x.color })))}<p class="muted small">Pontuação = curtidas + 2×comentários + 3×salvamentos + 3×compartilhamentos</p></div>
        <div class="card"><h3>${ico('calendar')}Melhores dias</h3>${hbars(a.dayStats)}</div>
        ${a.hourStats.length ? `<div class="card"><h3>${ico('clock')}Melhores horários</h3>${hbars(a.hourStats.slice(0, 6))}</div>` : ''}
        ${a.keywords.length ? `<div class="card"><h3>${ico('key')}Temas que mais engajam</h3><div class="chips">${a.keywords.map(k => `<span class="chip">${esc(k)}</span>`).join('')}</div></div>` : ''}
      </div></div>`;
    const rs = $('#igResync', body); if (rs) rs.onclick = async () => { rs.disabled = true; rs.textContent = 'Sincronizando…'; try { await igSync(b); App.render(); } catch (e) { toast('Erro: ' + e.message); rs.disabled = false; } };
    wireAI(body, () => `Analise os dados do Instagram da ${profile(b).name} e crie um plano de conteúdo para as próximas 2 semanas (10 posts) com tema, formato, gancho, melhor dia e horário.\n\nResumo: engajamento médio ${fmt.pct(a.avgEng, 2)}, ${fmt.num(a.perWeek, 1)} posts/semana, melhor formato ${a.fmtStats[0]?.label}, melhores dias ${a.dayStats.slice(0, 2).map(x => x.label).join(' e ')}, melhor horário ${a.hourStats[0]?.label || 'n/d'}.\nPalavras dos melhores posts: ${a.keywords.join(', ')}.\nMelhores posts:\n${a.top.map(p => `- ${p.format} (${p.date}): "${(p.caption || '').slice(0, 120)}" — ${p.likes} curtidas, ${p.comments} comentários, ${p.saves} salvamentos, ${p.shares} compartilhamentos`).join('\n')}\nPúblico: ${profile(b).publico}. Serviços: ${profile(b).servicos}.`, t => { $('#igAI', body).innerHTML = `<div class="out mt">${esc(t)}</div>`; });
  },
});

/* ---------- Recomendação de tráfego pago ---------- */
const ADS_KW = {
  abertura: ['abrir empresa {cidade}', 'como abrir cnpj', 'abertura de empresa', 'contador para abrir empresa', 'abrir empresa simples nacional', 'abrir ltda', 'transformar mei em me', 'quanto custa abrir uma empresa'],
  troca: ['trocar de contador', 'mudar de contador', 'contabilidade online', 'escritório de contabilidade {cidade}', 'contador {cidade}', 'melhor contabilidade {cidade}'],
  mensal: ['contador perto de mim', 'contabilidade {cidade}', 'escritório contábil {cidade}', 'contador para empresa', 'contabilidade para prestador de serviço', 'contador para clínica'],
  planejamento: ['planejamento tributário', 'reduzir impostos empresa', 'holding familiar', 'lucro presumido ou simples nacional', 'consultoria tributária {cidade}', 'revisão tributária'],
  irpf: ['declaração imposto de renda {cidade}', 'contador imposto de renda', 'fazer declaração irpf', 'contador para declarar imposto de renda', 'malha fina contador'],
  bpo: ['bpo financeiro', 'terceirizar financeiro empresa', 'gestão financeira terceirizada', 'contas a pagar e receber terceirizado'],
  mei: ['contador para mei', 'mei desenquadrado', 'declaração anual mei atrasada', 'mei para me', 'mei estourou limite'],
};
const ADS_NEG = ['curso', 'vaga', 'emprego', 'salário', 'concurso', 'faculdade', 'estágio', 'apostila', 'pdf', 'o que é', 'significado', 'modelo grátis', 'crc', 'sindicato', 'resumo', 'livro'];
const ADS_ANGLES = {
  abertura: ['Abra seu CNPJ em poucos dias, sem sair de casa', 'MEI estourou o limite? Hora de virar ME do jeito certo', 'Quanto custa abrir uma empresa? A resposta pode te surpreender'],
  troca: ['Seu contador demora dias para responder?', 'Troque de contador sem dor de cabeça — a gente cuida de tudo', 'Análise gratuita: descubra se você está pagando imposto a mais'],
  mensal: ['Contabilidade que responde rápido e pensa no seu crescimento', 'Pare de se preocupar com guias e prazos', 'Sua empresa em dia, você focado em vender'],
  planejamento: ['Empresas que faturam +R$ 100 mil/mês costumam pagar imposto a mais', 'Planejamento tributário: economia legal e comprovada', 'Holding familiar: proteja patrimônio e reduza impostos'],
  irpf: ['Declare seu IR com especialistas e evite a malha fina', 'Restituição maior e sem erros', 'Últimos dias: não pague multa por atraso'],
  bpo: ['Terceirize o financeiro e ganhe 10 horas por semana', 'Saiba exatamente quanto sua empresa lucra', 'Contas, cobranças e relatórios — tudo em dia'],
  mei: ['MEI: sua declaração anual está em dia?', 'Desenquadrado do MEI? Regularize antes da multa', 'Crescendo? Veja quando sair do MEI'],
};
const SVC_NAMES = { abertura: 'Abertura de empresa', troca: 'Troca de contador', mensal: 'Contabilidade mensal', planejamento: 'Planejamento tributário', irpf: 'IRPF', bpo: 'BPO financeiro', mei: 'MEI' };

view('ads', {
  title: 'Tráfego pago', icon: 'megaphone', sub: 'Estratégia, campanhas, públicos e diagnóstico',
  render(el) {
    const tb = tabs('adsTab', [['plan', 'Plano de campanha recomendado'], ['diag', 'Diagnóstico de campanha'], ['boost', 'O que impulsionar']]);
    el.innerHTML = tb.html + '<div id="adsBody"></div>';
    const body = $('#adsBody', el);
    if (tb.cur === 'diag') return renderAdsDiag(body);
    if (tb.cur === 'boost') return renderBoost(body);
    const last = state.ui.lastAds || { obj: 'mensal', budget: 1500, raio: 15 };
    body.innerHTML = `<div class="grid g-side-l"><div class="card" style="align-self:start"><form id="adsForm">${genBrandPicker()}
      ${F.select('obj', 'Serviço a anunciar', Object.entries(SVC_NAMES), last.obj)}${F.num('budget', 'Orçamento mensal (R$)', last.budget)}${F.num('raio', 'Raio de atuação (km) — 0 = Brasil todo', last.raio)}
      ${F.check('site', 'Tenho site / landing page', last.site)}${F.check('pixel', 'Tenho Pixel/Conversions API instalado', last.pixel)}
      <button class="btn primary mt" style="width:100%;justify-content:center">${ico('wand-2')}Montar plano</button></form></div><div class="card" style="align-self:start">${emptyState('Escolha o serviço e o orçamento e clique em “Montar plano”. O plano completo de campanha abre numa janela.', 'megaphone')}</div></div>`;
    const gen = () => {
      const d = formData($('#adsForm', body)); d.brand = genBrand(); state.ui.lastAds = d; save();
      const v = brandVars(d.brand), B = num(d.budget), city = profile(d.brand).city || 'sua cidade';
      const google = d.site && ['abertura', 'mensal', 'irpf', 'troca'].includes(d.obj);
      const split = B < 900 ? { meta: 100, google: 0, remk: 0 } : google ? (B < 2000 ? { meta: 60, google: 40, remk: 0 } : { meta: 50, google: 35, remk: 15 }) : (B < 2000 ? { meta: 85, google: 0, remk: 15 } : { meta: 75, google: 0, remk: 25 });
      const daily = x => fmt.money(B * x / 100 / 30);
      const kws = ADS_KW[d.obj].map(k => tpl(k, { cidade: city.toLowerCase() }));
      const angles = ADS_ANGLES[d.obj];
      const expLeads = B / BENCH.meta_msg.cpl[1];
      const host = modal({ title: 'Plano de campanha — ' + SVC_NAMES[d.obj] + ' (' + fmt.money(B) + '/mês)', size: 'xl', body: '<div id="adsOut"></div>', extraBtns: `<button type="button" class="btn" onclick="window.print()">${ico('printer')}Imprimir</button>` }).el;
      $('#adsOut', host).innerHTML = `
        <div class="card"><h3>${ico('pie-chart')}1. Divisão do orçamento (${fmt.money(B)}/mês)</h3>${hbars([{ label: 'Meta — Mensagens', value: B * split.meta / 100, color: '#2563eb' }, { label: 'Google Pesquisa', value: B * split.google / 100, color: '#16a34a' }, { label: 'Remarketing', value: B * split.remk / 100, color: '#ea580c' }].filter(x => x.value), { money: true })}
          <p class="small">Diário: Meta ${daily(split.meta)}${split.google ? ` · Google ${daily(split.google)}` : ''}${split.remk ? ` · Remarketing ${daily(split.remk)}` : ''}. ${B < 900 ? '<strong>Com menos de R$ 900/mês, concentre tudo em uma campanha de Mensagens na Meta</strong> — dividir verba muito pequena impede o algoritmo de aprender.' : ''}${!d.site ? ' Sem site, priorize Meta com destino WhatsApp.' : ''}</p>
          <div class="tip small">Estimativa realista: ~${fmt.num(expLeads)} conversas/mês (CPL ≈ ${fmt.money(BENCH.meta_msg.cpl[1])}). Valores de referência do mercado contábil — seus números reais vão calibrar isso em 2-3 semanas.</div></div>
        <div class="card mt"><h3>${ico('target')}2. Estrutura na Meta Ads</h3><div class="steps small">
          <div class="step"><strong>Campanha:</strong> objetivo <em>Engajamento → Mensagens (WhatsApp)</em>${d.pixel && d.site ? ' ou <em>Leads</em> com otimização para conversão' : ''}. Orçamento na campanha (Advantage+ budget).</div>
          <div class="step"><strong>Conjunto 1 — Público aberto (Advantage+):</strong> idade 25-60, ${num(d.raio) ? `raio de ${d.raio} km de ${esc(city)}` : 'Brasil'}. Deixe o criativo segmentar.</div>
          <div class="step"><strong>Conjunto 2 — Interesses:</strong> Empreendedorismo, Pequenas empresas, Microempreendedor individual, Administradores de páginas de negócios, Sebrae${d.obj === 'planejamento' ? ', Proprietários de empresas, Investimentos' : ''}.</div>
          ${split.remk ? `<div class="step"><strong>Conjunto 3 — Remarketing:</strong> envolvidos com o Instagram nos últimos 60 dias + quem viu 50% dos vídeos${d.pixel ? ' + visitantes do site 30 dias' : ''}. Criativos de prova social.</div>` : ''}
          <div class="step"><strong>Anúncios:</strong> 3 criativos por conjunto (2 vídeos + 1 carrossel), um para cada ângulo abaixo. Renove a cada 3-4 semanas.</div></div></div>
        ${split.google ? `<div class="card mt"><h3>${ico('search')}3. Google Ads — Pesquisa</h3><p class="small">Use correspondência de <strong>frase</strong> e <strong>exata</strong>. Ative extensões de chamada, local e sitelinks.</p>
          <div class="field"><span>Palavras-chave</span><div class="chips">${kws.map(k => `<span class="chip">"${esc(k)}"</span>`).join('')}</div></div>
          <div class="field"><span>Palavras negativas</span><div class="chips">${ADS_NEG.map(k => `<span class="chip">-${esc(k)}</span>`).join('')}</div></div>
          <button class="btn xs" id="cpKw">${ico('copy')}Copiar palavras</button></div>` : ''}
        <div class="card mt"><h3>${ico('pen-tool')}4. Ângulos e copies de anúncio</h3>${angles.map((a, i) => { const txt = `${a}\n\n${['Na ' + v.marca + ', ' + v.diferenciais.split(',')[0].toLowerCase() + '.', 'Mais de [X] empresas já confiam na ' + v.marca + '.', 'Análise gratuita e sem compromisso.'][i]}\n\n👉 Clique em "Enviar mensagem" e fale com um especialista agora.`; return `<div class="out"><h4>Anúncio ${i + 1} — ${['Dor', 'Prova social', 'Oferta'][i]}</h4>${esc(txt)}<div class="out-actions"><button class="btn xs" data-copy="${esc(txt)}">${ico('copy')}Copiar</button></div></div>`; }).join('')}
          <div class="row mt">${aiButtons('ads')}</div><div id="adsAI"></div></div>
        <div class="card mt"><h3>${ico('sliders-horizontal')}5. Regras de otimização</h3><ul class="small">
          <li>Não mexa nas campanhas nos primeiros <strong>3-5 dias</strong> (fase de aprendizado).</li>
          <li>Pause o anúncio que gastou <strong>2× o CPL meta</strong> sem gerar contato.</li>
          <li>CTR abaixo de <strong>1%</strong> = troque o gancho/capa do criativo.</li>
          <li>Frequência acima de <strong>3</strong> no público frio = renove criativos ou amplie o público.</li>
          <li>Escale só o que funciona: <strong>+20% de orçamento a cada 3-4 dias</strong>.</li>
          <li>Responda os contatos em até <strong>5 minutos</strong> — a velocidade dobra a taxa de fechamento.</li>
          <li>Marque a origem de cada lead no <a href="#/leads">CRM</a> para calcular o CAC real.</li></ul></div>
        <div class="card mt"><h3>${ico('calendar-range')}6. Plano de testes de 4 semanas</h3><table class="table small"><tr><th>Semana</th><th>Ação</th></tr>
          <tr><td>1</td><td>Subir campanha com 3 criativos (ângulos acima). Apenas observar.</td></tr>
          <tr><td>2</td><td>Pausar o pior criativo, criar 1 variação do melhor (novo gancho).</td></tr>
          <tr><td>3</td><td>Testar oferta diferente (diagnóstico grátis x conteúdo grátis).</td></tr>
          <tr><td>4</td><td>Escalar o vencedor +20% e montar remarketing com prova social.</td></tr></table></div>`;
      $$('[data-copy]', host).forEach(x => x.onclick = () => copy(x.dataset.copy));
      const ck = $('#cpKw', host); if (ck) ck.onclick = () => copy(kws.map(k => `"${k}"`).join('\n') + '\n\nNegativas:\n' + ADS_NEG.map(k => '-' + k).join('\n'));
      wireAI(host, () => tpl(PROMPTS.find(p => p.n === 'Copy de anúncio Meta Ads').p, { ...v, cidade: city }) + `\nServiço anunciado: ${SVC_NAMES[d.obj]}.`);
      icons();
    };
    $('#adsForm', body).onsubmit = e => { e.preventDefault(); gen(); };
  },
});

function renderAdsDiag(body) {
  const d0 = state.ui.lastDiag || { spend: 1500, impr: 60000, clicks: 900, leads: 80, meetings: 20, clients: 5, ticket: 450 };
  body.innerHTML = `<div class="grid g-side-l"><div class="card" style="align-self:start"><h3>${ico('stethoscope')}Números da campanha</h3><form id="dgForm">
    ${F.num('spend', 'Valor gasto (R$)', d0.spend)}${F.num('impr', 'Impressões', d0.impr)}${F.num('clicks', 'Cliques no link', d0.clicks)}${F.num('leads', 'Leads / conversas', d0.leads)}${F.num('meetings', 'Reuniões / diagnósticos', d0.meetings)}${F.num('clients', 'Clientes fechados', d0.clients)}${F.num('ticket', 'Honorário mensal médio (R$)', d0.ticket)}
    <button class="btn primary" style="width:100%;justify-content:center">${ico('activity')}Diagnosticar</button></form></div><div class="card" style="align-self:start">${emptyState('Preencha os números da campanha e clique em “Diagnosticar”. O resultado abre numa janela com o que melhorar em cada etapa.', 'stethoscope')}</div></div>`;
  const run = () => {
    const d = formData($('#dgForm', body)); state.ui.lastDiag = d; save();
    const ctr = d.impr ? d.clicks / d.impr * 100 : 0, cpm = d.impr ? d.spend / d.impr * 1000 : 0, cpc = d.clicks ? d.spend / d.clicks : 0, cpl = d.leads ? d.spend / d.leads : 0;
    const lr = d.clicks ? d.leads / d.clicks * 100 : 0, mr = d.leads ? d.meetings / d.leads * 100 : 0, cr = d.meetings ? d.clients / d.meetings * 100 : 0, cac = d.clients ? d.spend / d.clients : 0;
    const ltv = d.ticket * 24, roas = d.spend ? d.clients * d.ticket * 12 / d.spend : 0;
    const row = (n, [v, shown], ok, warn, tip, inv) => { const good = inv ? v <= ok : v >= ok, mid = inv ? v <= warn : v >= warn; const c = good ? 'ok' : mid ? 'warn' : 'bad'; return `<tr><td><strong>${n}</strong></td><td>${shown}</td><td><span class="badge ${c}">${good ? 'Bom' : mid ? 'Atenção' : 'Ruim'}</span></td><td class="small muted">${good ? '—' : tip}</td></tr>`; };
    modal({ title: 'Resultado do diagnóstico', size: 'xl', body: `<div><div class="table-wrap"><table class="table"><thead><tr><th>Métrica</th><th>Valor</th><th>Status</th><th>O que fazer</th></tr></thead><tbody>
      ${row('CTR', [ctr, fmt.pct(ctr, 2)], 1.5, 0.8, 'Criativo não chama atenção: teste novos ganchos nos 3 primeiros segundos e capas com texto grande.')}
      ${row('CPM', [cpm, fmt.money(cpm)], 25, 45, 'Público pequeno ou muito disputado: amplie o público ou o raio.', true)}
      ${row('CPC', [cpc, fmt.money(cpc)], 2.5, 5, 'Melhore o CTR ou teste o posicionamento Reels/Stories.', true)}
      ${row('CPL', [cpl, fmt.money(cpl)], 20, 40, 'Oferta pouco atrativa: ofereça diagnóstico gratuito ou material útil; revise a página/mensagem inicial.', true)}
      ${row('Clique → lead', [lr, fmt.pct(lr)], 8, 4, 'Página/WhatsApp com atrito: reduza campos, adicione prova social e botão claro.')}
      ${row('Lead → reunião', [mr, fmt.pct(mr)], 30, 15, 'Atendimento lento ou sem roteiro: responda em até 5 min e use o script de qualificação.')}
      ${row('Reunião → cliente', [cr, fmt.pct(cr)], 30, 15, 'Proposta fraca: mostre economia em R$, casos e envie proposta em até 24h.')}
      ${row('CAC', [cac || Infinity, cac ? fmt.money(cac) : '—'], ltv / 5, ltv / 3, 'CAC alto em relação ao LTV: ataque a etapa com pior conversão acima.', true)}
      </tbody></table></div>
      <div class="grid g3 mt"><div>${kpi('wallet', 'CAC', cac ? fmt.money(cac) : '—', `LTV estimado ${fmt.money(ltv)} (24 meses)`)}</div><div>${kpi('scale', 'LTV / CAC', cac ? fmt.num(ltv / cac, 1) + 'x' : '—', 'Ideal: acima de 3x')}</div><div>${kpi('trending-up', 'Retorno em 12 meses', fmt.num(roas, 1) + 'x', 'receita de 12 meses ÷ investimento')}</div></div></div>` });
    icons();
  };
  $('#dgForm', body).onsubmit = e => { e.preventDefault(); run(); };
}

function renderBoost(body) {
  const b = genBrand();
  const posts = DB.raw('igposts').filter(p => p.brand === b).sort((x, y) => postScore(y) - postScore(x)).slice(0, 8);
  body.innerHTML = `${genBrandPicker() ? `<div style="max-width:320px">${genBrandPicker()}</div>` : ''}<div class="grid g2"><div class="card"><h3>${ico('flame')}Posts recomendados para impulsionar</h3>
    ${posts.length ? `<div class="list">${posts.map((p, i) => `<div class="li"><strong style="width:24px">#${i + 1}</strong><div class="grow"><div class="t small">${esc((p.caption || p.format).slice(0, 80))}</div><div class="muted small">${fmt.date(p.date)} · ${esc(p.format)} · 💾 ${p.saves} · ↗ ${p.shares} · 💬 ${p.comments}</div></div>${p.permalink ? `<a class="btn xs" href="${esc(p.permalink)}" target="_blank">Abrir</a>` : ''}</div>`).join('')}</div>` : emptyState('Conecte o Instagram ou lance métricas para ver os posts recomendados.', 'flame')}</div>
    <div class="card"><h3>${ico('info')}Como impulsionar do jeito certo</h3><ul class="small">
      <li>Impulsione posts com <strong>alto salvamento e compartilhamento</strong> — prova de que o conteúdo é útil.</li>
      <li>Objetivo <strong>Mensagens</strong> para posts de oferta; <strong>Alcance/Engajamento</strong> para educativos (gera público de remarketing barato).</li>
      <li>Orçamento sugerido: <strong>R$ 15 a R$ 30/dia por 5 a 7 dias</strong> por post.</li>
      <li>Público: raio da cidade, 25-60 anos, interesses em empreendedorismo e pequenas empresas.</li>
      <li>Prefira o Gerenciador de Anúncios ao botão "Turbinar": mais controle de público e objetivo.</li>
      <li>Depois de 7 dias, compare o custo por resultado com seus anúncios normais.</li></ul></div></div>`;
}

/* ---------- Orçamento de tráfego ---------- */
const MIX_PRESETS = {
  equilibrado: { n: 'Equilibrado', s: { meta_msg: 55, google: 30, remk: 15 } },
  whats: { n: 'Foco em WhatsApp (sem site)', s: { meta_msg: 80, google: 0, remk: 20 } },
  google: { n: 'Foco em Google (alta intenção)', s: { meta_msg: 25, google: 65, remk: 10 } },
  leads: { n: 'Formulário de leads + remarketing', s: { meta_lead: 70, remk: 30 } },
};
const CH_CONV = { meta_msg: 5, meta_lead: 3.5, google: 14, remk: 8 };

view('budget', {
  title: 'Orçamento de tráfego', icon: 'calculator', sub: 'Quanto investir para bater sua meta de clientes',
  render(el) {
    const d0 = state.ui.lastBudget || { mode: 'meta', target: 8, have: 2000, ticket: 450, months: 24, mix: 'equilibrado', margin: 40 };
    el.innerHTML = `<div class="grid g-side-l"><div class="card" style="align-self:start"><form id="bgForm">${genBrandPicker()}
      ${F.select('mode', 'Calcular a partir de', [['meta', 'Minha meta de novos clientes'], ['have', 'Quanto eu tenho para investir']], d0.mode)}
      <div id="bgModeFields"></div>
      ${F.num('ticket', 'Honorário mensal médio (R$)', d0.ticket)}${F.num('months', 'Tempo médio que o cliente fica (meses)', d0.months)}${F.num('margin', 'Margem de lucro do serviço (%)', d0.margin)}
      ${F.select('mix', 'Mix de canais', Object.entries(MIX_PRESETS).map(([k, v]) => [k, v.n]), d0.mix)}
      <button class="btn primary mt" style="width:100%;justify-content:center">${ico('calculator')}Calcular</button></form>
      <p class="muted small mt">Custos e conversões usam médias do mercado contábil brasileiro (${Object.values(BENCH).map(b => b.n.split('—')[0].trim()).filter((x, i, a) => a.indexOf(x) === i).join(', ')}). Depois de 1 mês, substitua pelos seus números reais em Métricas.</p></div>
      <div class="card" style="align-self:start">${emptyState('Preencha ao lado e clique em “Calcular”. O orçamento recomendado, a divisão por canal e os cenários abrem numa janela.', 'calculator')}</div></div>`;
    const mf = () => { const m = $('[name=mode]', el).value; $('#bgModeFields', el).innerHTML = m === 'meta' ? F.num('target', 'Meta de novos clientes por mês', d0.target) : F.num('have', 'Orçamento mensal disponível (R$)', d0.have); };
    $('[name=mode]', el).onchange = mf; mf();
    const run = () => {
      const d = formData($('#bgForm', el)); Object.assign(d0, d); state.ui.lastBudget = d0; save();
      const mix = MIX_PRESETS[d.mix].s;
      const scen = [['Otimista', 0], ['Realista', 1], ['Pessimista', 2]].map(([n, idx]) => {
        const eff = Object.entries(mix).reduce((s, [ch, pct]) => s + pct / 100 * (CH_CONV[ch] / 100) / BENCH[ch].cpl[idx], 0);
        const B = d.mode === 'meta' ? (eff ? num(d.target) / eff : 0) : num(d.have);
        const clients = B * eff;
        const leads = Object.entries(mix).reduce((s, [ch, pct]) => s + B * pct / 100 / BENCH[ch].cpl[idx], 0);
        return { n, B, clients, leads, cac: clients ? B / clients : 0 };
      });
      const R = scen[1], ltv = num(d.ticket) * num(d.months), ltvM = ltv * num(d.margin) / 100;
      const payback = num(d.ticket) ? R.cac / (num(d.ticket) * num(d.margin) / 100) : 0;
      const ch = Object.entries(mix).map(([k, p]) => ({ k, label: BENCH[k].n, value: R.B * p / 100, leads: R.B * p / 100 / BENCH[k].cpl[1], p }));
      modal({ title: 'Orçamento recomendado', size: 'xl', body: `<div class="grid g3">
          ${kpi('wallet', d.mode === 'meta' ? 'Orçamento recomendado' : 'Orçamento', fmt.money(R.B) + '/mês', `${fmt.money(R.B / 30)} por dia`)}
          ${kpi('users', 'Novos clientes/mês', fmt.num(R.clients, 1), `${fmt.num(R.leads)} leads estimados`)}
          ${kpi('badge-dollar-sign', 'CAC estimado', fmt.money(R.cac), `LTV ${fmt.money(ltv)} · LTV/CAC ${R.cac ? fmt.num(ltv / R.cac, 1) : 0}x`)}</div>
        <div class="grid g2 mt"><div class="card"><h3>${ico('split')}Distribuição por canal (cenário realista)</h3>${hbars(ch.map(c => ({ label: c.label.replace('Meta Ads — ', 'Meta: '), value: c.value })), { money: true })}
          <table class="table small mt"><tr><th>Canal</th><th>%</th><th>Diário</th><th>Leads</th></tr>${ch.map(c => `<tr><td>${esc(c.label)}</td><td>${c.p}%</td><td>${fmt.money(c.value / 30)}</td><td>${fmt.num(c.leads)}</td></tr>`).join('')}</table></div>
          <div class="card"><h3>${ico('bar-chart-3')}Cenários</h3><table class="table"><tr><th></th><th>Orçamento</th><th>Clientes</th><th>CAC</th></tr>${scen.map(s => `<tr><td><strong>${s.n}</strong></td><td>${fmt.money(s.B)}</td><td>${fmt.num(s.clients, 1)}</td><td>${fmt.money(s.cac)}</td></tr>`).join('')}</table>
          <div class="mt">${hbars(scen.map(s => ({ label: s.n, value: s.clients, color: s.n === 'Otimista' ? '#16a34a' : s.n === 'Realista' ? 'var(--brand)' : '#dc2626' })), { suffix: ' clientes' })}</div></div></div>
        <div class="card mt"><h3>${ico('badge-check')}Leitura do analista</h3><div class="list small txt">
          <div class="li">💰 Cada cliente paga o investimento em <strong>${fmt.num(payback, 1)} meses</strong> de margem (payback). ${payback <= 6 ? '✅ Saudável.' : payback <= 12 ? '⚠️ Aceitável, mas acompanhe de perto.' : '❌ Longo demais: aumente o ticket, a conversão ou reduza o CPL.'}</div>
          <div class="li">📈 Em 12 meses (cenário realista): ${fmt.num(R.clients * 12)} clientes e ~${fmt.money(R.clients * 12 * num(d.ticket) * 6.5)} de receita no ano (entradas escalonadas), para ${fmt.money(R.B * 12)} investidos.</div>
          <div class="li">🧾 Margem de LTV por cliente: ${fmt.money(ltvM)}. Você pode pagar até <strong>${fmt.money(ltvM / 3)}</strong> de CAC mantendo LTV/CAC de 3x.</div>
          <div class="li">🧪 Reserve <strong>10% a 20%</strong> do orçamento (${fmt.money(R.B * .15)}) para testar criativos e ofertas novas.</div>
          <div class="li">⚙️ Mínimos práticos: Meta ≥ R$ 20/dia por conjunto; Google ≥ R$ 30/dia por campanha. ${R.B < 600 ? 'Com esse orçamento, use uma única campanha na Meta.' : ''}</div>
          <div class="li">🗓️ Sazonalidade: aumente 30-50% em <strong>janeiro</strong> (abertura/Simples), <strong>março-maio</strong> (IRPF) e <strong>dezembro</strong> (planejamento tributário).</div></div></div>` });
      icons();
    };
    $('#bgForm', el).onsubmit = e => { e.preventDefault(); run(); };
  },
});

/* ---------- Links rastreáveis (UTM + WhatsApp) ---------- */
const UTM_PRESETS = {
  'Bio do Instagram': { s: 'instagram', m: 'bio', c: 'perfil' }, 'Stories': { s: 'instagram', m: 'stories', c: '' }, 'Meta Ads': { s: 'meta', m: 'cpc', c: '' },
  'Google Ads': { s: 'google', m: 'cpc', c: '' }, 'WhatsApp / lista': { s: 'whatsapp', m: 'mensagem', c: '' }, 'E-mail': { s: 'email', m: 'newsletter', c: '' },
};
view('utm', {
  title: 'Links rastreáveis', icon: 'link', sub: 'UTM e links de WhatsApp para saber de onde vem cada cliente', isNew: true,
  render(el) {
    const p = profile(genBrand());
    el.innerHTML = `<div class="grid g2"><div class="card"><h3>${ico('link-2')}Gerador de UTM</h3><form id="utmForm">${F.text('url', 'URL de destino', p.site || 'https://')}
      <div class="chips mb">${Object.keys(UTM_PRESETS).map(k => `<span class="chip" data-pre="${k}">${k}</span>`).join('')}</div>
      <div class="form-row">${F.text('s', 'Origem (utm_source)', 'instagram')}${F.text('m', 'Mídia (utm_medium)', 'bio')}</div>
      <div class="form-row">${F.text('c', 'Campanha (utm_campaign)', 'perfil')}${F.text('ct', 'Conteúdo (utm_content)', '')}</div></form>
      <div class="out" id="utmOut"></div><div class="row mt-s"><button class="btn sm primary" id="utmCopy">${ico('copy')}Copiar</button><button class="btn sm" id="utmSave">${ico('save')}Salvar</button></div></div>
      <div class="card"><h3>${ico('message-circle')}Link de WhatsApp com mensagem rastreável</h3><form id="waForm">${F.text('num', 'Número com DDD (só números)', (p.whatsapp || '').replace(/\D/g, ''))}
      ${F.select('orig', 'Origem do link', ['Bio do Instagram', 'Stories', 'Anúncio Meta', 'Google', 'Site', 'Indicação'])}${F.area('msg', 'Mensagem inicial', 'Olá! Vim pelo {orig} e quero um diagnóstico gratuito da minha empresa.', 3)}</form>
      <div class="out" id="waOut"></div><div class="row mt-s"><button class="btn sm primary" id="waCopy">${ico('copy')}Copiar</button><a class="btn sm" id="waTest" target="_blank">${ico('external-link')}Testar</a></div>
      <p class="muted small mt">💡 Cada origem gera uma frase diferente — assim, quando o lead chegar no WhatsApp, você sabe exatamente de onde ele veio e registra no CRM.</p></div></div>
      <div class="card mt"><h3>${ico('history')}Links salvos</h3><div class="list">${DB.all('links').map(l => `<div class="li"><div class="grow small"><strong>${esc(l.name)}</strong><div class="muted" style="word-break:break-all">${esc(l.url)}</div></div><button class="btn xs" data-cp="${esc(l.url)}">${ico('copy')}</button><button class="btn xs danger" data-rm="${l.id}">${ico('x')}</button></div>`).join('') || emptyState('Nenhum link salvo')}</div></div>`;
    const utm = () => { const d = formData($('#utmForm', el)); let u; try { u = new URL(d.url); } catch (e) { $('#utmOut', el).textContent = 'URL inválida'; return ''; } [['utm_source', d.s], ['utm_medium', d.m], ['utm_campaign', d.c], ['utm_content', d.ct]].forEach(([k, v]) => v && u.searchParams.set(k, v.trim().toLowerCase().replace(/\s+/g, '_'))); $('#utmOut', el).textContent = u.toString(); return u.toString(); };
    const wa = () => { const d = formData($('#waForm', el)); const n = d.num.replace(/\D/g, ''); const full = n.length <= 11 ? '55' + n : n; const url = `https://wa.me/${full}?text=${encodeURIComponent(d.msg.replace('{orig}', d.orig.toLowerCase()))}`; $('#waOut', el).textContent = url; $('#waTest', el).href = url; return url; };
    $$('input,select,textarea', el).forEach(i => i.addEventListener('input', () => { utm(); wa(); }));
    $$('[data-pre]', el).forEach(c => c.onclick = () => { const pr = UTM_PRESETS[c.dataset.pre]; $('[name=s]', el).value = pr.s; $('[name=m]', el).value = pr.m; $('[name=c]', el).value = pr.c; utm(); });
    $('#utmCopy', el).onclick = () => copy(utm());
    $('#utmSave', el).onclick = () => { const u = utm(); if (!u) { modal({ title: 'Falta o endereço', body: '<div class="tip warn">Preencha a <strong>URL de destino</strong> com um endereço completo, por exemplo: https://seusite.com.br</div>' }); return; } promptBox('Salvar link rastreável', 'Nome para este link', 'Link ' + formData($('#utmForm', el)).s, n => { DB.add('links', { name: n, url: u }); toast('Link salvo'); App.render(); }, { saveLabel: 'Salvar' }); };
    const waSave = document.createElement('button'); waSave.className = 'btn sm'; waSave.innerHTML = `${ico('save')}Salvar`; $('#waCopy', el).after(waSave);
    waSave.onclick = () => promptBox('Salvar link de WhatsApp', 'Nome para este link', 'WhatsApp — ' + formData($('#waForm', el)).orig, n => { DB.add('links', { name: n, url: wa() }); toast('Link salvo'); App.render(); }, { saveLabel: 'Salvar' });
    $('#waCopy', el).onclick = () => copy(wa());
    $$('[data-cp]', el).forEach(b => b.onclick = () => copy(b.dataset.cp));
    $$('[data-rm]', el).forEach(b => b.onclick = () => { DB.remove('links', b.dataset.rm); App.render(); });
    utm(); wa();
  },
});
