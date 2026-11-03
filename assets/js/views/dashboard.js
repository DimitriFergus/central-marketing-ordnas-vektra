/* ===== Painel geral ===== */
view('dashboard', {
  title: 'Painel', icon: 'layout-dashboard', sub: 'Visão geral do seu marketing',
  render(el) {
    const t = today(), mk = monthKey();
    const posts = DB.all('posts');
    const week = posts.filter(p => p.date >= t && p.date <= addDays(t, 6));
    const monthPosts = posts.filter(p => (p.date || '').startsWith(mk));
    const published = monthPosts.filter(p => p.status === 'publicado').length;
    const leads = DB.all('leads');
    const leadsMonth = leads.filter(l => (l.date || l.createdAt || '').startsWith(mk));
    const won = leadsMonth.filter(l => l.stage === 'ganho');
    const metrics = DB.all('metrics').sort((a, b) => a.month.localeCompare(b.month));
    const lastM = metrics[metrics.length - 1];
    const invest = lastM ? num(lastM.invest) : 0;
    const cpl = lastM && num(lastM.leads) ? invest / num(lastM.leads) : 0;
    const igFollowers = state.brand === 'all'
      ? sum(['ordnas', 'vektra'], b => state.ig[b]?.profile?.followers_count || 0)
      : state.ig[state.brand]?.profile?.followers_count;

    const h = new Date().getHours();
    const greet = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';

    el.innerHTML = `
    <div class="row mb"><div><h2 style="font-size:22px">${greet}! 👋</h2><p class="muted" style="margin:4px 0 0">${fmt.dateLong(t)} — aqui está o resumo do seu marketing.</p></div><span class="sp"></span>
      <button class="btn" onclick="editPost({date:today()})">${ico('plus')}Novo post</button>
      <button class="btn" onclick="location.hash='#/scripts'">${ico('clapperboard')}Criar roteiro</button>
      <button class="btn primary" onclick="location.hash='#/captions'">${ico('sparkles')}Gerar legenda</button></div>

    <div class="grid g4">
      ${kpi('calendar-check', 'Posts nos próximos 7 dias', week.length, `${week.filter(p => ['agendado', 'publicado'].includes(p.status)).length} já agendados`)}
      ${kpi('send', 'Publicados no mês', `${published}/${monthPosts.length}`, monthPosts.length ? `${fmt.pct(published / monthPosts.length * 100, 0)} do planejado` : 'Nenhum post planejado')}
      ${kpi('users', 'Leads no mês', leadsMonth.length, `${won.length} clientes fechados${leadsMonth.length ? ' · ' + fmt.pct(won.length / leadsMonth.length * 100) : ''}`)}
      ${kpi('camera','Seguidores', igFollowers ? fmt.num(igFollowers) : (lastM?.followers ? fmt.num(lastM.followers) : '—'), igFollowers ? 'Instagram conectado' : (lastM ? 'Último mês registrado' : 'Conecte o Instagram'))}
    </div>

    <div class="grid g-side mt">
      <div class="grid" style="align-content:start">
        <div class="card"><div class="card-head"><h3>${ico('lightbulb')}Recomendações inteligentes</h3></div><div class="list">${smartTips().map(x => `<div class="li"><span class="badge ${x.lvl}">${x.tag}</span><div class="grow">${x.msg}</div>${x.act ? `<a class="btn xs" href="${x.act[1]}">${x.act[0]}</a>` : ''}</div>`).join('')}</div></div>
        <div class="card"><div class="card-head"><h3>${ico('calendar-days')}Próximos posts</h3><span class="sp"></span><a class="btn sm" href="#/calendar">Ver calendário</a></div>
          ${week.length ? `<div class="list">${week.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).map(postRow).join('')}</div>` : emptyState('Nenhum post para os próximos 7 dias. Use “Gerar plano do mês” no calendário.', 'calendar-x')}
        </div>
        ${metrics.length >= 2 ? `<div class="card"><h3>${ico('trending-up')}Evolução (últimos meses)</h3>${lineChart([
          { name: 'Leads', color: '#16a34a', data: metrics.slice(-6).map(m => num(m.leads)) },
          { name: 'Clientes', color: '#c9a227', data: metrics.slice(-6).map(m => num(m.clients)) }], metrics.slice(-6).map(m => MONTHS[+m.month.slice(5) - 1].slice(0, 3)))}</div>` : ''}
      </div>
      <div class="grid" style="align-content:start">
        <div class="card"><h3>${ico('wallet')}Tráfego pago (último mês)</h3>
          ${lastM ? `<div class="row"><div><div class="muted small">Investimento</div><div style="font-size:20px;font-weight:800">${fmt.money(invest)}</div></div><span class="sp"></span><div><div class="muted small">CPL</div><div style="font-size:20px;font-weight:800">${cpl ? fmt.money(cpl) : '—'}</div></div><span class="sp"></span><div><div class="muted small">CAC</div><div style="font-size:20px;font-weight:800">${num(lastM.clients) ? fmt.money(invest / num(lastM.clients)) : '—'}</div></div></div>`
          : `<p class="muted small">Registre as métricas do mês para acompanhar investimento, CPL e CAC.</p><a class="btn sm" href="#/metrics">Registrar métricas</a>`}
        </div>
        <div class="card"><h3>${ico('flag')}Datas e prazos que viram conteúdo</h3><div class="list">${upcomingDates(30).slice(0, 6).map(d => `<div class="li"><div style="width:46px;text-align:center"><div style="font-weight:800;font-size:17px">${parseYMD(d.date).getDate()}</div><div class="muted small">${MONTHS[parseYMD(d.date).getMonth()].slice(0, 3)}</div></div><div class="grow"><div class="t small">${esc(d.t)}</div><div class="muted small">💡 ${esc(d.pauta)}</div></div></div>`).join('') || emptyState('Sem datas nos próximos 30 dias')}</div></div>
        <div class="card"><div class="card-head"><h3>${ico('target')}Metas</h3><span class="sp"></span><a class="btn sm" href="#/goals">Gerenciar</a></div>
          ${DB.all('goals').slice(0, 5).map(g => { const p = clamp(num(g.current) / Math.max(num(g.target), 1) * 100, 0, 100); return `<div class="mt-s"><div class="row small"><span>${esc(g.name)}</span><span class="sp"></span><strong>${fmt.num(g.current)}/${fmt.num(g.target)}</strong></div><div class="progress"><div style="width:${p}%"></div></div></div>`; }).join('') || emptyState('Defina metas para acompanhar seu progresso', 'target')}
        </div>
      </div>
    </div>`;
  },
});

function kpi(icon, label, val, sub) {
  return `<div class="card kpi"><div class="lbl">${ico(icon)}${label}</div><div class="val">${val}</div><div class="sub">${sub || ''}</div></div>`;
}
function postRow(p) {
  const st = POST_STATUS.find(s => s[0] === p.status);
  return `<div class="li" style="cursor:pointer" onclick="editPost(DB.get('posts','${p.id}'))"><span class="dot" style="background:${FORMAT_COLORS[p.format] || '#888'}"></span>
    <div class="grow"><div class="t">${esc(p.title || 'Sem título')}</div><div class="muted small">${fmt.dateLong(p.date)}${p.time ? ' · ' + p.time : ''} · ${esc(p.format || '')}</div></div>
    ${state.brand === 'all' ? brandBadge(p.brand) : ''}<span class="badge ${p.status === 'publicado' ? 'ok' : p.status === 'agendado' ? 'info' : ''}">${st ? st[1] : ''}</span></div>`;
}

/* Alertas automáticos baseados nos dados */
function smartTips() {
  const tips = [], t = today();
  const posts = DB.all('posts');
  const next3 = posts.filter(p => p.date >= t && p.date <= addDays(t, 3));
  if (!next3.length) tips.push({ lvl: 'bad', tag: 'Urgente', msg: 'Não há nenhum post planejado para os próximos 3 dias.', act: ['Planejar', '#/calendar'] });
  const late = posts.filter(p => p.date < t && p.status !== 'publicado');
  if (late.length) tips.push({ lvl: 'warn', tag: 'Atraso', msg: `${late.length} post(s) com data passada ainda não marcados como publicados.`, act: ['Ver produção', '#/production'] });
  const last30 = posts.filter(p => p.date >= addDays(t, -30) && p.date <= t);
  if (last30.length >= 4) {
    const reels = last30.filter(p => p.format === 'Reels').length / last30.length;
    if (reels < .3) tips.push({ lvl: 'info', tag: 'Formato', msg: `Só ${fmt.pct(reels * 100, 0)} dos posts recentes foram Reels. Reels são o formato que mais alcança novas pessoas — busque ao menos 40%.` });
    const conv = last30.filter(p => p.objective === 'conversao').length / last30.length;
    if (conv < .15) tips.push({ lvl: 'info', tag: 'Vendas', msg: 'Poucos conteúdos com objetivo de conversão. Inclua 1 post de oferta/diagnóstico por semana.' });
  }
  const leads = DB.all('leads');
  const stale = leads.filter(l => ['novo'].includes(l.stage) && (l.date || l.createdAt.slice(0, 10)) <= addDays(t, -1));
  if (stale.length) tips.push({ lvl: 'bad', tag: 'Leads', msg: `${stale.length} lead(s) novos sem contato há mais de 24h. Lead esfria rápido!`, act: ['Abrir CRM', '#/leads'] });
  const brands = state.brand === 'all' ? ['ordnas', 'vektra'] : [state.brand];
  brands.forEach(b => { if (!state.ig[b]?.token && !DB.raw('igposts').some(x => x.brand === b)) tips.push({ lvl: '', tag: 'Instagram', msg: `Conecte o Instagram da ${BRANDS[b].name} (ou lance métricas manualmente) para receber recomendações personalizadas.`, act: ['Conectar', '#/instagram'] }); });
  const d = upcomingDates(15)[0];
  if (d) tips.push({ lvl: 'ok', tag: 'Pauta', msg: `Em ${Math.round((parseYMD(d.date) - parseYMD(t)) / 864e5)} dia(s): <strong>${esc(d.t)}</strong>. Sugestão: ${esc(d.pauta)}.`, act: ['Ver datas', '#/dates'] });
  const mk = monthKey();
  if (new Date().getDate() >= 25 && !DB.all('metrics').some(m => m.month === mk)) tips.push({ lvl: 'warn', tag: 'Relatório', msg: 'Fim do mês chegando: registre as métricas e gere o relatório mensal.', act: ['Métricas', '#/metrics'] });
  const ideas = DB.all('ideas').length;
  if (ideas < 5) tips.push({ lvl: '', tag: 'Ideias', msg: 'Seu banco de ideias está quase vazio. Mantenha pelo menos 15 ideias para nunca travar.', act: ['Banco de ideias', '#/ideas'] });
  if (!tips.length) tips.push({ lvl: 'ok', tag: 'Tudo certo', msg: 'Seu marketing está em dia. Que tal testar um funil novo esta semana?', act: ['Funis', '#/funnels'] });
  return tips;
}
