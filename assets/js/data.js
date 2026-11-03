/* ===== Base de conhecimento de marketing para contabilidade ===== */

const FORMATS = ['Reels', 'Carrossel', 'Post estático', 'Stories', 'Live', 'Anúncio'];
const FORMAT_COLORS = { 'Reels': '#e11d48', 'Carrossel': '#2563eb', 'Post estático': '#0891b2', 'Stories': '#d97706', 'Live': '#7c3aed', 'Anúncio': '#16a34a' };
const POST_STATUS = [
  ['ideia', 'Ideia'], ['roteiro', 'Roteiro'], ['producao', 'Gravação / Design'], ['revisao', 'Revisão'], ['agendado', 'Agendado'], ['publicado', 'Publicado'],
];
const OBJECTIVES = [['alcance', 'Alcance (atrair novos)'], ['autoridade', 'Autoridade (educar)'], ['engajamento', 'Engajamento (conversar)'], ['conversao', 'Conversão (gerar contato)'], ['relacionamento', 'Relacionamento (bastidores)']];

/* Temas prontos para contabilidade */
const TOPICS = [
  { t: 'MEI pode ter funcionário? Regras e limites', p: 'Educação fiscal', f: 'Reels' },
  { t: '5 erros que fazem o MEI ser desenquadrado', p: 'Educação fiscal', f: 'Carrossel' },
  { t: 'Simples Nacional, Lucro Presumido ou Real: qual escolher?', p: 'Educação fiscal', f: 'Carrossel' },
  { t: 'Quanto custa abrir uma empresa em {cidade}?', p: 'Oferta', f: 'Reels' },
  { t: 'Passo a passo para abrir seu CNPJ sem dor de cabeça', p: 'Educação fiscal', f: 'Carrossel' },
  { t: 'Pró-labore x distribuição de lucros: a diferença que economiza imposto', p: 'Educação fiscal', f: 'Reels' },
  { t: 'Por que separar conta PF e PJ é obrigatório para crescer', p: 'Dicas rápidas', f: 'Reels' },
  { t: 'Fator R: como médicos, dentistas e devs pagam menos imposto', p: 'Educação fiscal', f: 'Carrossel' },
  { t: 'Sinais de que você está pagando imposto demais', p: 'Educação fiscal', f: 'Carrossel' },
  { t: 'O que o contador faz por você (além de emitir guia)', p: 'Bastidores', f: 'Reels' },
  { t: 'Um dia na rotina do nosso escritório', p: 'Bastidores', f: 'Stories' },
  { t: 'Como trocar de contador sem burocracia', p: 'Oferta', f: 'Carrossel' },
  { t: 'Checklist do IRPF: documentos que você precisa separar', p: 'Educação fiscal', f: 'Carrossel' },
  { t: 'Malha fina: 7 motivos mais comuns e como evitar', p: 'Educação fiscal', f: 'Carrossel' },
  { t: 'Quem é obrigado a declarar Imposto de Renda este ano', p: 'Educação fiscal', f: 'Reels' },
  { t: 'Nota fiscal de serviço: como emitir do jeito certo', p: 'Dicas rápidas', f: 'Reels' },
  { t: 'DAS atrasado: o que acontece e como regularizar', p: 'Dicas rápidas', f: 'Reels' },
  { t: 'Quanto custa um funcionário de verdade (além do salário)', p: 'Educação fiscal', f: 'Carrossel' },
  { t: 'Férias, 13º e rescisão: o que o empresário precisa provisionar', p: 'Educação fiscal', f: 'Carrossel' },
  { t: 'Fluxo de caixa: o controle simples que salva empresas', p: 'Gestão e números', f: 'Carrossel' },
  { t: 'Os 3 números que todo empresário deveria olhar todo mês', p: 'Gestão e números', f: 'Reels' },
  { t: 'Cliente conta: como economizamos R$ X/ano em impostos', p: 'Prova social', f: 'Reels' },
  { t: 'Depoimento de cliente: antes e depois da contabilidade', p: 'Prova social', f: 'Reels' },
  { t: 'Mito ou verdade: MEI não paga imposto', p: 'Dicas rápidas', f: 'Reels' },
  { t: 'Mito ou verdade: abrir empresa é caro e demorado', p: 'Dicas rápidas', f: 'Reels' },
  { t: 'Holding familiar: quando vale a pena', p: 'Educação fiscal', f: 'Carrossel' },
  { t: 'Reforma tributária: o que muda para pequenas empresas (IBS/CBS)', p: 'Educação fiscal', f: 'Carrossel' },
  { t: 'Como a reforma tributária afeta prestadores de serviço', p: 'Educação fiscal', f: 'Reels' },
  { t: 'Prestador de serviço para o exterior: como pagar menos imposto', p: 'Educação fiscal', f: 'Carrossel' },
  { t: 'E-commerce: tributação de quem vende online', p: 'Educação fiscal', f: 'Carrossel' },
  { t: 'Infoprodutor e criador de conteúdo: precisa de CNPJ?', p: 'Educação fiscal', f: 'Reels' },
  { t: 'Perguntas que recebemos toda semana (respondendo seguidores)', p: 'Engajamento', f: 'Stories' },
  { t: 'Conheça nossa equipe: quem cuida da sua empresa', p: 'Bastidores', f: 'Carrossel' },
  { t: 'Planejamento tributário: por que fazer antes de janeiro', p: 'Oferta', f: 'Reels' },
  { t: 'BPO financeiro: terceirize o financeiro e foque em vender', p: 'Oferta', f: 'Carrossel' },
  { t: 'Certificado digital: o que é e quando você precisa', p: 'Dicas rápidas', f: 'Post estático' },
  { t: 'Calendário de obrigações do mês para empresários', p: 'Dicas rápidas', f: 'Post estático' },
  { t: 'Quando o MEI precisa virar ME (e como fazer)', p: 'Educação fiscal', f: 'Reels' },
  { t: 'Contabilidade digital x tradicional: o que muda para você', p: 'Tecnologia', f: 'Carrossel' },
  { t: 'Ferramentas que usamos para deixar sua empresa em dia', p: 'Tecnologia', f: 'Reels' },
];

/* Ganchos (primeiros 3 segundos) */
const HOOKS = [
  'Se você tem CNPJ, para tudo e assiste isso.',
  'Você provavelmente está pagando imposto demais — e nem sabe.',
  'O erro de {tema_curto} que mais vejo no escritório.',
  'Ninguém te conta isso sobre {tema_curto}.',
  '3 coisas que eu faria se tivesse acabado de abrir minha empresa.',
  'Seu contador já te falou isso? Se não, é um sinal de alerta.',
  'Isso pode gerar multa para sua empresa ainda este mês.',
  'A pergunta que mais recebo no WhatsApp esta semana:',
  'Pare de cometer esse erro com {tema_curto}.',
  'Como contador(a), eu NUNCA faria isso na minha empresa.',
  'Salve este vídeo antes que você precise dele.',
  'Mito ou verdade? {tema}',
  'Em 30 segundos você vai entender {tema_curto}.',
  'Um cliente chegou aqui pagando o dobro de imposto. Olha o que fizemos.',
  'Se você é MEI, isso é para você.',
  'O governo não vai te avisar, então eu aviso: ',
  'Antes de contratar um contador, assista isso.',
  'Você sabe a diferença entre faturamento e lucro? Muita empresa quebra por isso.',
];

const CTAS = {
  alcance: ['Salve este post para não esquecer.', 'Compartilhe com aquele amigo empreendedor.', 'Envie para quem precisa ver isso hoje.', 'Siga {handle} para mais dicas como essa.'],
  autoridade: ['Salve e volte quando precisar.', 'Quer que eu aprofunde esse tema? Comente "QUERO".', 'Siga {handle}: toda semana tem conteúdo que economiza seu dinheiro.'],
  engajamento: ['Comente aqui: qual sua maior dúvida sobre isso?', 'Responda nos comentários: você já passou por isso?', 'Marque um sócio que precisa ver isso.'],
  conversao: ['Chame no direct a palavra "ANÁLISE" e faça um diagnóstico gratuito.', 'Clique no link da bio e fale com um especialista.', 'Mande "QUERO" no WhatsApp {whatsapp} e receba uma análise gratuita.', 'Agende uma conversa gratuita pelo link da bio.'],
  relacionamento: ['Conta pra gente nos comentários o que achou!', 'Quer ver mais bastidores? Deixa um ❤️.', 'Manda uma mensagem, a gente adora conversar com você.'],
};

const HASHTAGS = {
  'Contabilidade': '#contabilidade #contador #contabilidadedigital #escritoriocontabil #contadora #contabil',
  'Empreendedorismo': '#empreendedorismo #empreendedor #pequenasempresas #gestaoempresarial #negocios #empresario',
  'MEI': '#mei #microempreendedor #microempreendedorindividual #cnpj #meibrasil',
  'Impostos': '#impostos #simplesnacional #planejamentotributario #tributos #reformatributaria',
  'IRPF': '#impostoderenda #irpf #declaracaodeimposto #receitafederal #malhafina',
  'Abertura de empresa': '#aberturadeempresa #abrirempresa #cnpj #novaempresa #formalizacao',
  'Gestão financeira': '#fluxodecaixa #gestaofinanceira #bpofinanceiro #financasempresariais',
  'Departamento pessoal': '#departamentopessoal #folhadepagamento #clt #rh #esocial',
};

/* Estruturas de roteiro */
const SCRIPT_STRUCTURES = {
  'gcc': { name: 'Gancho → Conteúdo → CTA (clássico)', parts: [
    ['GANCHO (0-3s)', '{hook}'],
    ['CONTEXTO (3-10s)', 'Muita gente que tem empresa não sabe, mas {tema_lower} impacta diretamente no seu bolso e na sua tranquilidade.'],
    ['CONTEÚDO (10-45s)', 'Ponto 1: explique o conceito de forma simples, com um exemplo real.\nPonto 2: mostre o erro mais comum que você vê nos clientes.\nPonto 3: dê a solução prática (o que fazer hoje).'],
    ['CTA (45-60s)', '{cta}']] },
  'pas': { name: 'PAS — Problema, Agitação, Solução', parts: [
    ['PROBLEMA', '{hook}\nVocê sente que {dor}?'],
    ['AGITAÇÃO', 'E o pior: enquanto isso não é resolvido, você corre o risco de pagar mais imposto, levar multa ou perder o controle do caixa. Mês após mês.'],
    ['SOLUÇÃO', 'A saída é {tema_lower}. Na {marca}, fazemos isso assim: (1) analisamos sua situação, (2) ajustamos o que está errado, (3) acompanhamos todo mês.'],
    ['CTA', '{cta}']] },
  'aida': { name: 'AIDA — Atenção, Interesse, Desejo, Ação', parts: [
    ['ATENÇÃO', '{hook}'],
    ['INTERESSE', 'Hoje eu vou te mostrar {tema_lower} em menos de 1 minuto — e por que isso importa para quem é {publico_curto}.'],
    ['DESEJO', 'Imagina fechar o mês sabendo exatamente quanto sobrou, sem susto com imposto e sem correr atrás de guia. É isso que acontece quando {tema_lower} está bem resolvido.'],
    ['AÇÃO', '{cta}']] },
  'mito': { name: 'Mito ou Verdade', parts: [
    ['ABERTURA', 'Mito ou verdade? (mostrar a afirmação na tela)'],
    ['AFIRMAÇÃO 1', '"{tema}" → Resposta: MITO/VERDADE + explicação em 1 frase.'],
    ['AFIRMAÇÃO 2', 'Outra crença comum sobre o tema → resposta + exemplo prático.'],
    ['AFIRMAÇÃO 3', 'A que mais surpreende → resposta + "isso pode te custar caro".'],
    ['CTA', 'Qual dessas você acreditava? Comenta aqui. {cta}']] },
  'lista': { name: 'Lista (3 erros / 5 dicas)', parts: [
    ['GANCHO', '3 erros sobre {tema_lower} que podem custar caro para sua empresa:'],
    ['ERRO 1', 'Descreva o erro + consequência (multa, imposto a mais, problema com a Receita).'],
    ['ERRO 2', 'Descreva o erro + como corrigir em 1 passo.'],
    ['ERRO 3', 'O erro mais grave + o que a {marca} faz para evitar.'],
    ['CTA', '{cta}']] },
  'story': { name: 'Storytelling (caso de cliente)', parts: [
    ['GANCHO', 'Um cliente chegou aqui com um problema sério de {tema_curto}.'],
    ['SITUAÇÃO', 'Conte quem era (sem expor nome): segmento, tamanho, o que estava acontecendo.'],
    ['VIRADA', 'O que descobrimos ao analisar a empresa e qual decisão tomamos.'],
    ['RESULTADO', 'Números: economia, regularização, tempo ganho. Seja específico (ex.: "R$ 2.300 por mês").'],
    ['LIÇÃO + CTA', 'A lição para você: … {cta}']] },
  'antes': { name: 'Antes x Depois', parts: [
    ['ANTES', '{hook}\nMostre o cenário caótico: papelada, guias atrasadas, sem saber o lucro.'],
    ['TRANSIÇÃO', 'Corte com efeito: "Aí ele conheceu a {marca}…"'],
    ['DEPOIS', 'Mostre o cenário organizado: relatórios claros, impostos em dia, empresário tranquilo.'],
    ['CTA', '{cta}']] },
  'resposta': { name: 'Respondendo seguidor (caixinha / comentário)', parts: [
    ['ABERTURA', 'Mostre na tela a pergunta do seguidor sobre {tema_curto}.'],
    ['RESPOSTA CURTA', 'Responda em uma frase direta (sim/não/depende de quê).'],
    ['EXPLICAÇÃO', 'Explique o "porquê" com um exemplo de valores ou situação real.'],
    ['ALERTA', 'O cuidado que a pessoa precisa ter.'],
    ['CTA', 'Manda sua pergunta também. {cta}']] },
};

const SCRIPT_FORMATS = {
  'reels30': { name: 'Reels 30s', tips: 'Corte a cada 2-3s, legenda na tela, gancho visual no primeiro frame, até 75 palavras faladas.' },
  'reels60': { name: 'Reels 60-90s', tips: 'Até 180 palavras faladas, B-roll do escritório, texto na tela com os pontos principais.' },
  'carrossel': { name: 'Carrossel (7-10 slides)', tips: 'Slide 1 = gancho forte; 1 ideia por slide; último slide com CTA e "salve".' },
  'stories': { name: 'Sequência de Stories (5-7)', tips: 'Use enquete/caixinha no 2º ou 3º story; finalize com link ou "chama no direct".' },
  'live': { name: 'Live / Aula (20-40 min)', tips: 'Roteiro em blocos de 5 min, pergunte nome e cidade do público, oferta no final.' },
  'anuncio': { name: 'Anúncio em vídeo (15-30s)', tips: 'Dor nos 3s iniciais, prova (número/depoimento), oferta clara e CTA único.' },
};

/* Datas fiscais e comemorativas que viram pauta (confira as datas oficiais de cada ano) */
const DATES = [
  { m: 1, d: 31, t: 'Prazo para opção pelo Simples Nacional (último dia útil de janeiro)', tipo: 'fiscal', pauta: 'Último aviso: quem quer entrar no Simples tem até o fim do mês' },
  { m: 1, d: 10, t: 'Planejamento do ano / IPVA e IPTU', tipo: 'comercial', pauta: 'Checklist financeiro de janeiro para empresários' },
  { m: 2, d: 28, t: 'Informe de rendimentos (empresas enviam até o último dia útil de fev.)', tipo: 'fiscal', pauta: 'Seu informe de rendimentos chegou? O que fazer com ele' },
  { m: 3, d: 15, t: 'Dia do Consumidor', tipo: 'comercial', pauta: 'Oferta especial / condição para abertura de empresa' },
  { m: 3, d: 16, t: 'Início do prazo do IRPF (normalmente meados de março)', tipo: 'fiscal', pauta: 'IRPF começou: checklist de documentos + campanha de declaração' },
  { m: 3, d: 31, t: 'DEFIS — Simples Nacional (31/03)', tipo: 'fiscal', pauta: 'O que é a DEFIS e por que sua empresa precisa entregar' },
  { m: 4, d: 25, t: 'Dia do Contabilista', tipo: 'institucional', pauta: 'Homenagem à equipe + bastidores do escritório' },
  { m: 5, d: 1, t: 'Dia do Trabalho', tipo: 'comercial', pauta: 'Direitos do trabalhador x custos do empregador' },
  { m: 5, d: 29, t: 'Fim do prazo do IRPF (normalmente fim de maio)', tipo: 'fiscal', pauta: 'Últimos dias para declarar: evite multa' },
  { m: 5, d: 31, t: 'DASN-SIMEI — declaração anual do MEI (31/05)', tipo: 'fiscal', pauta: 'MEI: declaração anual vence dia 31. Passo a passo' },
  { m: 6, d: 30, t: 'Fechamento do 1º semestre', tipo: 'comercial', pauta: 'Balanço do semestre: como está a saúde da sua empresa?' },
  { m: 7, d: 31, t: 'ECF — Escrituração Contábil Fiscal (último dia útil de julho)', tipo: 'fiscal', pauta: 'Obrigações do Lucro Presumido/Real no meio do ano' },
  { m: 8, d: 11, t: 'Dia do Advogado / profissionais liberais', tipo: 'comercial', pauta: 'Tributação para advogados: PF x PJ' },
  { m: 9, d: 15, t: 'Dia do Cliente', tipo: 'comercial', pauta: 'Agradecimento + depoimentos de clientes' },
  { m: 9, d: 22, t: 'Dia do Contador', tipo: 'institucional', pauta: 'Mitos sobre a profissão + o que fazemos de verdade' },
  { m: 10, d: 5, t: 'Dia Nacional da Micro e Pequena Empresa', tipo: 'comercial', pauta: 'Homenagem aos pequenos empresários + dicas de crescimento' },
  { m: 10, d: 18, t: 'Dia do Médico', tipo: 'comercial', pauta: 'Médico PJ: como pagar menos imposto legalmente' },
  { m: 11, d: 27, t: 'Black Friday (última sexta de novembro)', tipo: 'comercial', pauta: 'Condição especial: abertura de empresa / troca de contador' },
  { m: 11, d: 30, t: '1ª parcela do 13º salário (até 30/11)', tipo: 'fiscal', pauta: 'Empregador: como calcular e pagar o 13º' },
  { m: 12, d: 1, t: 'Planejamento tributário para o próximo ano', tipo: 'comercial', pauta: 'Por que dezembro é o mês de revisar o regime tributário' },
  { m: 12, d: 20, t: '2ª parcela do 13º salário (até 20/12)', tipo: 'fiscal', pauta: 'Prazo final do 13º e encargos' },
  { m: 12, d: 25, t: 'Natal', tipo: 'institucional', pauta: 'Mensagem de fim de ano + retrospectiva da empresa' },
];
const MONTHLY_DATES = [
  { d: 5, t: 'Salários (até o 5º dia útil)', pauta: 'Lembrete de folha de pagamento' },
  { d: 20, t: 'DAS / FGTS / INSS (dia 20)', pauta: 'Lembrete: guias do mês vencem dia 20' },
];

/* Biblioteca de prompts */
const PROMPTS = [
  { cat: 'Estratégia', n: 'Calendário editorial do mês', p: 'Você é um estrategista de marketing especialista em escritórios de contabilidade. Crie um calendário editorial de 30 dias para o Instagram da {marca}, público: {publico}. Serviços: {servicos}. Tom de voz: {tom}. Pilares: {pilares}. Para cada dia traga: formato (Reels, Carrossel, Stories), tema, gancho, objetivo (alcance/autoridade/conversão) e CTA. Considere as obrigações fiscais e datas comemorativas de {mes}.' },
  { cat: 'Estratégia', n: 'Análise de persona (ICP)', p: 'Crie 3 personas detalhadas para a {marca}, que atende {publico}. Para cada persona: nome fictício, idade, tipo de empresa, faturamento, principais dores ({dores}), objeções para contratar contador, onde consome conteúdo, gatilhos de compra e 5 ideias de conteúdo que falariam diretamente com ela.' },
  { cat: 'Estratégia', n: 'Posicionamento e diferenciais', p: 'Atue como consultor de branding. A {marca} tem os diferenciais: {diferenciais}. Crie: 1) uma proposta de valor em 1 frase, 2) 3 slogans, 3) uma bio de Instagram com até 150 caracteres, 4) 5 mensagens-chave para repetir no conteúdo, 5) o que NÃO comunicar.' },
  { cat: 'Roteiro', n: 'Roteiro de Reels viral', p: 'Escreva um roteiro de Reels de 45 segundos sobre "{tema}" para a {marca}. Estrutura: gancho nos 3 primeiros segundos (dê 5 opções), desenvolvimento em 3 pontos com exemplo prático em reais, CTA final. Inclua indicações de corte, texto na tela e B-roll. Tom: {tom}. Linguagem simples, sem juridiquês.' },
  { cat: 'Roteiro', n: 'Sequência de Stories que vende', p: 'Crie uma sequência de 7 stories para a {marca} sobre "{tema}" com objetivo de gerar conversas no direct. Use: story 1 gancho, story 2 enquete, story 3-4 conteúdo, story 5 prova social, story 6 oferta, story 7 caixinha/CTA. Indique o texto de cada story e o sticker interativo.' },
  { cat: 'Roteiro', n: 'Roteiro de live/aula', p: 'Monte o roteiro de uma live de 30 minutos da {marca} com o tema "{tema}" para {publico}. Inclua: abertura, 3 blocos de conteúdo, momento de perguntas, prova social e oferta de diagnóstico gratuito no final. Sugira o título e 3 posts de divulgação.' },
  { cat: 'Carrossel', n: 'Carrossel educativo', p: 'Crie o texto de um carrossel de 8 slides para o Instagram da {marca} sobre "{tema}". Slide 1: título-gancho com no máximo 8 palavras. Slides 2-7: uma ideia por slide, frases curtas, com exemplo numérico. Slide 8: CTA para salvar e chamar no direct. Sugira também a paleta visual e o tipo de imagem para cada slide.' },
  { cat: 'Legenda', n: 'Legenda com SEO para Instagram', p: 'Escreva 3 versões de legenda para um post da {marca} sobre "{tema}". Objetivo: {objetivo}. Primeira linha que prenda (até 125 caracteres), corpo escaneável com emojis moderados, palavras-chave para busca do Instagram (ex.: contador em {cidade}), CTA claro e 8 hashtags relevantes. Tom: {tom}.' },
  { cat: 'Legenda', n: 'Respostas para comentários e DMs', p: 'Crie 10 respostas prontas, humanas e educadas, para comentários e mensagens que a {marca} recebe: pedido de preço, dúvida sobre MEI, reclamação, elogio, "vocês atendem minha cidade?", "é caro?", "já tenho contador". Cada resposta deve levar a conversa para o WhatsApp sem parecer robótica.' },
  { cat: 'Imagem', n: 'Imagem para post (Midjourney / DALL·E / Gemini)', p: 'Fotografia corporativa realista, escritório de contabilidade moderno e iluminado, profissional sorrindo atendendo um empresário, notebook com gráficos financeiros, tons {cores}, luz natural, estilo editorial, profundidade de campo, 4:5 vertical, espaço livre no topo para título. --ar 4:5' },
  { cat: 'Imagem', n: 'Capa de Reels / thumbnail', p: 'Crie uma capa de Reels 9:16 para a {marca}: fundo em {cores}, título grande e legível "{tema}", pessoa com expressão de surpresa apontando para o texto, estilo clean e profissional, alto contraste, sem poluição visual.' },
  { cat: 'Imagem', n: 'Ícones e elementos do carrossel', p: 'Conjunto de ícones minimalistas em linha fina sobre contabilidade (calculadora, nota fiscal, gráfico, cofre, calendário, documento), cor {cores}, fundo transparente, estilo consistente, vetor.' },
  { cat: 'Anúncio', n: 'Copy de anúncio Meta Ads', p: 'Crie 5 variações de anúncio para Meta Ads da {marca} com objetivo de mensagens no WhatsApp. Público: {publico} em {cidade}. Oferta: diagnóstico gratuito. Para cada variação: texto principal (até 125 caracteres no início), título (até 40), descrição e ângulo usado (dor, ganho, prova social, urgência, curiosidade).' },
  { cat: 'Anúncio', n: 'Anúncios Google Ads (pesquisa)', p: 'Crie um anúncio responsivo de pesquisa do Google Ads para a {marca} em {cidade}: 15 títulos (até 30 caracteres), 4 descrições (até 90), lista de 30 palavras-chave com intenção de contratação e 20 palavras-chave negativas para contabilidade.' },
  { cat: 'Anúncio', n: 'Roteiro de anúncio em vídeo', p: 'Escreva 3 roteiros de anúncio em vídeo de 20 segundos para a {marca}. Ângulos: (1) dor de pagar imposto demais, (2) troca de contador sem burocracia, (3) abertura de empresa rápida. Cada roteiro: gancho visual, fala, texto na tela e CTA.' },
  { cat: 'Vendas', n: 'Script de WhatsApp para leads', p: 'Crie um script de atendimento no WhatsApp para leads da {marca} que chegam por anúncio. Inclua: mensagem de boas-vindas, 4 perguntas de qualificação (faturamento, regime atual, número de funcionários, principal dor), como apresentar a proposta, 5 respostas a objeções (preço, já tenho contador, vou pensar) e follow-up para quem sumiu (D+1, D+3, D+7).' },
  { cat: 'Vendas', n: 'Sequência de e-mails de nutrição', p: 'Crie uma sequência de 5 e-mails para leads que baixaram um material da {marca} sobre "{tema}". E-mail 1 entrega, 2 educação, 3 caso de sucesso, 4 quebra de objeção, 5 oferta de diagnóstico. Assuntos curtos e curiosos.' },
  { cat: 'Análise', n: 'Análise de métricas do Instagram', p: 'Analise estes dados do Instagram da {marca} e me diga: quais formatos e temas performam melhor, melhores horários, o que parar de fazer, o que dobrar e 5 ações para o próximo mês. Dados: [cole aqui alcance, curtidas, comentários, salvamentos, compartilhamentos por post].' },
  { cat: 'Análise', n: 'Análise de concorrente', p: 'Analise o perfil de Instagram do concorrente [@perfil] no mercado de contabilidade. Liste: pilares de conteúdo, formatos mais usados, frequência, ganchos que funcionam, ofertas, pontos fracos e 10 oportunidades de conteúdo que a {marca} pode explorar para se diferenciar.' },
  { cat: 'Análise', n: 'Relatório mensal para a diretoria', p: 'Transforme estes números de marketing do mês da {marca} em um relatório executivo de 1 página: resumo, destaques, o que não funcionou, aprendizado e plano do próximo mês. Números: [seguidores, alcance, leads, clientes, investimento, CPL, CAC].' },
];

/* Tipos de etapa nos funis */
const NODE_TYPES = {
  trafego: { n: 'Tráfego', c: '#e11d48' },
  conteudo: { n: 'Conteúdo', c: '#2563eb' },
  captura: { n: 'Captura', c: '#0891b2' },
  nutricao: { n: 'Nutrição', c: '#7c3aed' },
  conversa: { n: 'Conversa / WhatsApp', c: '#16a34a' },
  reuniao: { n: 'Reunião / Diagnóstico', c: '#d97706' },
  oferta: { n: 'Oferta / Proposta', c: '#c026d3' },
  venda: { n: 'Fechamento', c: '#059669' },
  posvenda: { n: 'Pós-venda / LTV', c: '#0f766e' },
  remarketing: { n: 'Remarketing', c: '#ea580c' },
};

/* Funis de vendas mais usados no mercado, adaptados para escritórios de contabilidade */
const FUNNEL_TEMPLATES = [
  {
    id: 'ctwa', name: 'Click-to-WhatsApp (Anúncio → Conversa)', origem: 'Modelo mais usado por negócios de serviço no Brasil (Meta Ads, objetivo Mensagens)', nivel: 'Iniciante', ideal: 'Gerar clientes rápido com orçamento baixo. Melhor primeiro funil para escritórios.',
    desc: 'Anúncio direciona direto para o WhatsApp. A conversa qualifica, agenda um diagnóstico e fecha a proposta. Curto, barato e mensurável.',
    kpis: ['Custo por conversa iniciada', 'Taxa de resposta', 'Conversa → reunião', 'Reunião → cliente'],
    nodes: [
      { id: 'a', t: 'trafego', n: 'Anúncio Meta (Mensagens)', d: 'Vídeo de dor + oferta de diagnóstico gratuito. Raio da cidade.', c: 0, r: 1 },
      { id: 'b', t: 'conversa', n: 'Conversa no WhatsApp', d: 'Resposta automática + atendimento humano em até 5 min.', c: 1, r: 1, rate: 100 },
      { id: 'c', t: 'conversa', n: 'Qualificação', d: 'Faturamento, regime, funcionários, dor principal.', c: 2, r: 1, rate: 60 },
      { id: 'd', t: 'reuniao', n: 'Diagnóstico (call 20 min)', d: 'Análise gratuita da situação da empresa.', c: 3, r: 1, rate: 40 },
      { id: 'e', t: 'oferta', n: 'Proposta', d: 'Enviar em até 24h, com economia estimada.', c: 4, r: 1, rate: 80 },
      { id: 'f', t: 'venda', n: 'Cliente fechado', d: 'Contrato + onboarding.', c: 5, r: 1, rate: 35 },
      { id: 'g', t: 'remarketing', n: 'Follow-up D+1, D+3, D+7', d: 'Para quem parou de responder.', c: 2, r: 2.3 },
      { id: 'h', t: 'posvenda', n: 'Indicação', d: 'Pedir indicação após 60 dias.', c: 5, r: 2.3 },
    ],
    edges: [['a', 'b'], ['b', 'c'], ['c', 'd'], ['d', 'e'], ['e', 'f'], ['c', 'g'], ['g', 'd'], ['f', 'h']],
    sim: { mode: 'cpl', cost: 18, label: 'Custo por conversa (R$)' },
  },
  {
    id: 'leadmagnet', name: 'Isca Digital (Lead Magnet / Squeeze)', origem: 'Inspirado no "Lead Funnel" de Russell Brunson (DotCom Secrets)', nivel: 'Intermediário', ideal: 'Construir lista de contatos e educar antes de vender.',
    desc: 'Oferece um material gratuito (checklist, planilha, guia) em troca do contato. Depois nutre por e-mail/WhatsApp até a oferta de diagnóstico.',
    kpis: ['Custo por lead', 'Conversão da página', 'Abertura de e-mails', 'Lead → reunião'],
    nodes: [
      { id: 'a', t: 'trafego', n: 'Anúncio + Reels', d: 'Divulga a isca: "Planilha de fluxo de caixa grátis".', c: 0, r: 1 },
      { id: 'b', t: 'captura', n: 'Página de captura', d: 'Nome, WhatsApp, e-mail, segmento.', c: 1, r: 1 },
      { id: 'c', t: 'conteudo', n: 'Entrega da isca', d: 'Página de obrigado + vídeo curto.', c: 2, r: 1, rate: 100 },
      { id: 'd', t: 'nutricao', n: 'Nutrição 7 dias', d: '5 e-mails/WhatsApp: educação, caso, objeção, oferta.', c: 3, r: 1, rate: 100 },
      { id: 'e', t: 'reuniao', n: 'Diagnóstico gratuito', d: 'Convite no 5º dia.', c: 4, r: 1, rate: 12 },
      { id: 'f', t: 'venda', n: 'Cliente', d: 'Proposta + fechamento.', c: 5, r: 1, rate: 35 },
      { id: 'g', t: 'remarketing', n: 'Remarketing', d: 'Visitou e não converteu.', c: 1, r: 2.3 },
    ],
    edges: [['a', 'b'], ['b', 'c'], ['c', 'd'], ['d', 'e'], ['e', 'f'], ['b', 'g'], ['g', 'b']],
    sim: { mode: 'cpl', cost: 9, label: 'Custo por lead (R$)' },
  },
  {
    id: 'application', name: 'Diagnóstico / Aplicação (High Ticket)', origem: 'Baseado no "Application Funnel" de alto valor (Russell Brunson / consultorias)', nivel: 'Intermediário', ideal: 'Empresas maiores, planejamento tributário, holding, BPO.',
    desc: 'Conteúdo de autoridade leva para um formulário de aplicação que filtra o lead. Só os qualificados vão para a reunião com o sócio.',
    kpis: ['Aplicações por semana', '% qualificados', 'Show rate da reunião', 'Ticket médio'],
    nodes: [
      { id: 'a', t: 'conteudo', n: 'Conteúdo de autoridade', d: 'Casos de economia, vídeos longos, lives.', c: 0, r: 0.5 },
      { id: 'a2', t: 'trafego', n: 'Anúncio para aplicação', d: '"Sua empresa fatura +R$ 100 mil/mês?"', c: 0, r: 1.7 },
      { id: 'b', t: 'captura', n: 'Formulário de aplicação', d: 'Faturamento, regime, sócios, desafios.', c: 1, r: 1.1 },
      { id: 'c', t: 'conversa', n: 'Pré-qualificação', d: 'SDR confirma perfil por WhatsApp.', c: 2, r: 1.1, rate: 50 },
      { id: 'd', t: 'reuniao', n: 'Reunião estratégica', d: 'Com o sócio. Mostrar economia projetada.', c: 3, r: 1.1, rate: 70 },
      { id: 'e', t: 'oferta', n: 'Proposta personalizada', d: 'Planejamento + contabilidade mensal.', c: 4, r: 1.1, rate: 90 },
      { id: 'f', t: 'venda', n: 'Contrato', d: '', c: 5, r: 1.1, rate: 40 },
    ],
    edges: [['a', 'b'], ['a2', 'b'], ['b', 'c'], ['c', 'd'], ['d', 'e'], ['e', 'f']],
    sim: { mode: 'cpl', cost: 45, label: 'Custo por aplicação (R$)' },
  },
  {
    id: 'webinar', name: 'Aula ao vivo / Webinar', origem: 'Inspirado no "Perfect Webinar" (Russell Brunson)', nivel: 'Avançado', ideal: 'Educar muita gente de uma vez e vender planejamento ou abertura.',
    desc: 'Inscrição para uma aula gratuita ("Como pagar menos imposto em 2027"), lembretes, aula com oferta no final e follow-up.',
    kpis: ['Custo por inscrito', 'Taxa de presença', 'Conversão na aula', 'Vendas no follow-up'],
    nodes: [
      { id: 'a', t: 'trafego', n: 'Anúncios de inscrição', d: '7-10 dias antes da aula.', c: 0, r: 1 },
      { id: 'b', t: 'captura', n: 'Página de inscrição', d: 'Título forte + data + bônus.', c: 1, r: 1 },
      { id: 'c', t: 'nutricao', n: 'Grupo + lembretes', d: 'WhatsApp: D-3, D-1, 1h, ao vivo.', c: 2, r: 1, rate: 100 },
      { id: 'd', t: 'conteudo', n: 'Aula ao vivo', d: '40 min conteúdo + 15 min oferta.', c: 3, r: 1, rate: 30 },
      { id: 'e', t: 'oferta', n: 'Oferta com bônus', d: 'Condição válida por 72h.', c: 4, r: 1, rate: 100 },
      { id: 'f', t: 'venda', n: 'Clientes', d: '', c: 5, r: 1, rate: 8 },
      { id: 'g', t: 'remarketing', n: 'Replay + follow-up', d: 'Para quem não assistiu.', c: 3, r: 2.3 },
    ],
    edges: [['a', 'b'], ['b', 'c'], ['c', 'd'], ['d', 'e'], ['e', 'f'], ['c', 'g'], ['g', 'e']],
    sim: { mode: 'cpl', cost: 7, label: 'Custo por inscrito (R$)' },
  },
  {
    id: 'organic', name: 'Conteúdo Orgânico (Topo → Meio → Fundo)', origem: 'Funil de conteúdo TOFU / MOFU / BOFU (inbound marketing — HubSpot)', nivel: 'Iniciante', ideal: 'Crescer o perfil e vender sem depender só de anúncio.',
    desc: 'Reels de alcance atraem, carrosséis educativos geram autoridade, stories com prova social e caixinhas convertem em direct.',
    kpis: ['Alcance de não seguidores', 'Salvamentos', 'Visitas ao perfil', 'Directs/semana'],
    nodes: [
      { id: 'a', t: 'conteudo', n: 'TOPO: Reels de alcance', d: 'Temas amplos, ganchos fortes, tendências.', c: 0, r: 1 },
      { id: 'b', t: 'conteudo', n: 'MEIO: Carrosséis', d: 'Educação profunda, salva e compartilha.', c: 1, r: 1, rate: 3 },
      { id: 'c', t: 'conteudo', n: 'FUNDO: Stories', d: 'Bastidores, depoimentos, oferta.', c: 2, r: 1, rate: 25 },
      { id: 'd', t: 'conversa', n: 'Direct / WhatsApp', d: 'Palavra-chave nos comentários (automação).', c: 3, r: 1, rate: 4 },
      { id: 'e', t: 'reuniao', n: 'Diagnóstico', d: '', c: 4, r: 1, rate: 40 },
      { id: 'f', t: 'venda', n: 'Cliente', d: '', c: 5, r: 1, rate: 35 },
      { id: 'g', t: 'trafego', n: 'Impulsionar top posts', d: 'Posts com mais salvamentos.', c: 0, r: 2.3 },
    ],
    edges: [['a', 'b'], ['b', 'c'], ['c', 'd'], ['d', 'e'], ['e', 'f'], ['g', 'a']],
    sim: { mode: 'reach', cost: 0, label: 'Alcance mensal (pessoas)', base: 50000 },
  },
  {
    id: 'launch', name: 'Lançamento Sazonal (Semana do IRPF / Planejamento)', origem: 'Inspirado na "Fórmula de Lançamento" de Jeff Walker (PLF)', nivel: 'Avançado', ideal: 'Picos de demanda: IRPF, planejamento tributário de dezembro, Black Friday.',
    desc: 'Pré-lançamento com 3 conteúdos de valor, abertura de vagas com condição especial e fechamento com urgência real.',
    kpis: ['Leads na lista', 'Engajamento nos conteúdos', 'Vendas na abertura', 'Vendas no último dia'],
    nodes: [
      { id: 'a', t: 'trafego', n: 'Captação de lista', d: '"Lista VIP do IRPF" — 15 dias antes.', c: 0, r: 1 },
      { id: 'b', t: 'conteudo', n: 'Conteúdo 1: Oportunidade', d: 'Por que declarar cedo (restituição primeiro).', c: 1, r: 0.3 },
      { id: 'c', t: 'conteudo', n: 'Conteúdo 2: Transformação', d: 'Casos: restituição maior, malha evitada.', c: 1, r: 1.1 },
      { id: 'd', t: 'conteudo', n: 'Conteúdo 3: Experiência', d: 'Como funciona o processo + quebra de objeções.', c: 1, r: 1.9 },
      { id: 'e', t: 'oferta', n: 'Abertura de vagas', d: 'Preço especial + bônus para os primeiros.', c: 2, r: 1.1, rate: 100 },
      { id: 'f', t: 'venda', n: 'Fechamento (escassez)', d: 'Vagas limitadas pela capacidade da equipe.', c: 3, r: 1.1, rate: 10 },
      { id: 'g', t: 'posvenda', n: 'Upsell: contabilidade PJ', d: 'Cliente IRPF que tem empresa.', c: 4, r: 1.1, rate: 10 },
    ],
    edges: [['a', 'b'], ['a', 'c'], ['a', 'd'], ['b', 'e'], ['c', 'e'], ['d', 'e'], ['e', 'f'], ['f', 'g']],
    sim: { mode: 'cpl', cost: 6, label: 'Custo por lead da lista (R$)' },
  },
  {
    id: 'tripwire', name: 'Produto de Entrada (Tripwire / Low Ticket)', origem: 'Modelo "Tripwire" do marketing de resposta direta (DigitalMarketer)', nivel: 'Intermediário', ideal: 'Transformar desconhecidos em clientes pagantes com baixo risco.',
    desc: 'Vende algo barato e muito útil (consultoria de 30 min R$ 97, kit MEI, revisão de regime) e depois oferece o plano mensal.',
    kpis: ['Custo por venda de entrada', 'Ticket de entrada', 'Upsell para plano mensal', 'ROAS'],
    nodes: [
      { id: 'a', t: 'trafego', n: 'Anúncio do produto de entrada', d: '"Revisão do seu regime tributário por R$ 97".', c: 0, r: 1 },
      { id: 'b', t: 'captura', n: 'Página de vendas', d: 'Benefícios + garantia.', c: 1, r: 1 },
      { id: 'c', t: 'oferta', n: 'Compra do produto', d: 'Checkout simples (Pix/cartão).', c: 2, r: 1, rate: 3 },
      { id: 'd', t: 'reuniao', n: 'Entrega (consultoria)', d: 'Mostra o valor e o diagnóstico.', c: 3, r: 1, rate: 100 },
      { id: 'e', t: 'oferta', n: 'Oferta do plano mensal', d: 'Abate o valor pago no 1º mês.', c: 4, r: 1, rate: 100 },
      { id: 'f', t: 'venda', n: 'Cliente recorrente', d: '', c: 5, r: 1, rate: 30 },
    ],
    edges: [['a', 'b'], ['b', 'c'], ['c', 'd'], ['d', 'e'], ['e', 'f']],
    sim: { mode: 'cpc', cost: 1.8, label: 'Custo por clique (R$)' },
  },
  {
    id: 'quiz', name: 'Funil de Quiz (Diagnóstico interativo)', origem: 'Quiz Funnel (Ryan Levesque — método "Ask")', nivel: 'Intermediário', ideal: 'Gerar leads segmentados e muito engajados.',
    desc: '"Descubra em 1 minuto se você está pagando imposto demais". O resultado personalizado leva ao WhatsApp com a resposta.',
    kpis: ['Início do quiz', 'Conclusão do quiz', 'Leads por resultado', 'Lead → cliente'],
    nodes: [
      { id: 'a', t: 'trafego', n: 'Anúncio / Reels', d: '"Faça o teste: seu regime está certo?"', c: 0, r: 1 },
      { id: 'b', t: 'captura', n: 'Quiz (5-7 perguntas)', d: 'Faturamento, atividade, folha, regime.', c: 1, r: 1 },
      { id: 'c', t: 'captura', n: 'Contato para o resultado', d: 'Nome + WhatsApp.', c: 2, r: 1, rate: 55 },
      { id: 'd1', t: 'conversa', n: 'Resultado: "Pagando demais"', d: 'Oferta de diagnóstico urgente.', c: 3, r: 0.4, rate: 100 },
      { id: 'd2', t: 'nutricao', n: 'Resultado: "Está ok"', d: 'Nutrição + dicas de gestão.', c: 3, r: 1.8 },
      { id: 'e', t: 'reuniao', n: 'Diagnóstico', d: '', c: 4, r: 1, rate: 30 },
      { id: 'f', t: 'venda', n: 'Cliente', d: '', c: 5, r: 1, rate: 35 },
    ],
    edges: [['a', 'b'], ['b', 'c'], ['c', 'd1'], ['c', 'd2'], ['d1', 'e'], ['d2', 'e'], ['e', 'f']],
    sim: { mode: 'cpc', cost: 1.5, label: 'Custo por clique (R$)', firstRate: 20 },
  },
  {
    id: 'google', name: 'Busca no Google (Alta intenção)', origem: 'Funil de pesquisa (Google Ads / SEO local)', nivel: 'Iniciante', ideal: 'Captar quem já está procurando contador agora.',
    desc: 'Palavras-chave como "contador perto de mim", "abrir empresa em {cidade}". Página de destino direta com WhatsApp e telefone.',
    kpis: ['CPC', 'CTR', 'Conversão da página', 'Custo por contato'],
    nodes: [
      { id: 'a', t: 'trafego', n: 'Google Ads Pesquisa', d: 'Palavras de intenção + negativas.', c: 0, r: 0.5 },
      { id: 'a2', t: 'trafego', n: 'Google Meu Negócio', d: 'Avaliações + fotos + posts semanais.', c: 0, r: 1.7 },
      { id: 'b', t: 'captura', n: 'Landing page local', d: 'Prova social, botão de WhatsApp fixo.', c: 1, r: 1.1 },
      { id: 'c', t: 'conversa', n: 'WhatsApp / Ligação', d: '', c: 2, r: 1.1, rate: 10 },
      { id: 'd', t: 'reuniao', n: 'Diagnóstico', d: '', c: 3, r: 1.1, rate: 50 },
      { id: 'e', t: 'venda', n: 'Cliente', d: '', c: 4, r: 1.1, rate: 40 },
    ],
    edges: [['a', 'b'], ['a2', 'c'], ['b', 'c'], ['c', 'd'], ['d', 'e']],
    sim: { mode: 'cpc', cost: 4.5, label: 'Custo por clique (R$)' },
  },
  {
    id: 'switch', name: 'Troca de Contador (Migração)', origem: 'Funil de "switching" — usado por SaaS e serviços recorrentes', nivel: 'Intermediário', ideal: 'Atrair empresas insatisfeitas com o contador atual.',
    desc: 'Conteúdo de "sinais de que seu contador está te custando caro" + análise gratuita da contabilidade atual + migração assistida.',
    kpis: ['Leads com contador atual', 'Análises realizadas', 'Migrações fechadas'],
    nodes: [
      { id: 'a', t: 'conteudo', n: 'Conteúdo "sinais de alerta"', d: 'Contador que não responde, imposto alto…', c: 0, r: 1 },
      { id: 'b', t: 'trafego', n: 'Anúncio "troque sem burocracia"', d: 'Público: donos de empresa 2+ anos.', c: 1, r: 0.3 },
      { id: 'c', t: 'captura', n: 'Análise gratuita da contabilidade', d: 'Pede últimas guias e balancete.', c: 2, r: 1, rate: 100 },
      { id: 'd', t: 'reuniao', n: 'Devolutiva com erros encontrados', d: 'Mostrar oportunidades em R$.', c: 3, r: 1, rate: 60 },
      { id: 'e', t: 'oferta', n: 'Proposta + migração assistida', d: 'A gente fala com o contador antigo.', c: 4, r: 1, rate: 90 },
      { id: 'f', t: 'venda', n: 'Cliente migrado', d: '', c: 5, r: 1, rate: 45 },
    ],
    edges: [['a', 'c'], ['b', 'c'], ['c', 'd'], ['d', 'e'], ['e', 'f']],
    sim: { mode: 'cpl', cost: 25, label: 'Custo por lead (R$)' },
  },
  {
    id: 'remarketing', name: 'Remarketing (Recuperação de interesse)', origem: 'Retargeting em camadas (padrão de mídia paga)', nivel: 'Iniciante', ideal: 'Converter quem já viu seus conteúdos ou visitou o site.',
    desc: 'Públicos de quem engajou nos últimos 30/60/180 dias recebem prova social, oferta e urgência em sequência.',
    kpis: ['Frequência', 'CTR', 'Custo por conversa', 'Conversões assistidas'],
    nodes: [
      { id: 'a', t: 'remarketing', n: 'Engajou 30 dias', d: 'Vídeo 50%+, interações, visitou perfil.', c: 0, r: 0.3 },
      { id: 'a2', t: 'remarketing', n: 'Visitou site 60 dias', d: 'Pixel/Conversions API.', c: 0, r: 1.7 },
      { id: 'b', t: 'conteudo', n: 'Prova social', d: 'Depoimentos, casos em números.', c: 1, r: 1 },
      { id: 'c', t: 'oferta', n: 'Oferta + urgência', d: 'Bônus por tempo limitado.', c: 2, r: 1, rate: 100 },
      { id: 'd', t: 'conversa', n: 'WhatsApp', d: '', c: 3, r: 1, rate: 3 },
      { id: 'e', t: 'venda', n: 'Cliente', d: '', c: 4, r: 1, rate: 15 },
    ],
    edges: [['a', 'b'], ['a2', 'b'], ['b', 'c'], ['c', 'd'], ['d', 'e']],
    sim: { mode: 'reach', cost: 0, label: 'Pessoas impactadas', base: 8000 },
  },
  {
    id: 'referral', name: 'Indicação + Pós-venda (LTV)', origem: 'Flywheel de retenção e indicação (HubSpot / programas de referral)', nivel: 'Iniciante', ideal: 'Aumentar o faturamento com quem já é cliente. Custo de aquisição quase zero.',
    desc: 'Onboarding encantador, NPS, programa de indicação com recompensa e oferta de serviços adicionais (BPO, IRPF dos sócios).',
    kpis: ['NPS', 'Indicações por mês', 'Churn', 'Receita de upsell'],
    nodes: [
      { id: 'a', t: 'venda', n: 'Novo cliente', d: '', c: 0, r: 1 },
      { id: 'b', t: 'posvenda', n: 'Onboarding 30 dias', d: 'Boas-vindas, kit, reunião de alinhamento.', c: 1, r: 1, rate: 100 },
      { id: 'c', t: 'posvenda', n: 'Pesquisa NPS (90 dias)', d: '', c: 2, r: 1, rate: 100 },
      { id: 'd', t: 'posvenda', n: 'Programa "Indique e ganhe"', d: 'Mensalidade grátis / desconto.', c: 3, r: 0.3, rate: 70 },
      { id: 'e', t: 'oferta', n: 'Upsell / Cross-sell', d: 'BPO, IRPF dos sócios, planejamento.', c: 3, r: 1.7 },
      { id: 'f', t: 'venda', n: 'Indicações fechadas', d: '', c: 4, r: 0.3, rate: 20 },
    ],
    edges: [['a', 'b'], ['b', 'c'], ['c', 'd'], ['c', 'e'], ['d', 'f']],
    sim: { mode: 'base', cost: 0, label: 'Clientes ativos na carteira', base: 80 },
  },
];

/* Benchmarks médios de mídia paga para contabilidade no Brasil (referência — varia por cidade e criativo) */
const BENCH = {
  meta_msg: { n: 'Meta Ads — Mensagens (WhatsApp)', cpl: [8, 18, 35], conv: 'Conversa → cliente: 3% a 8%' },
  meta_lead: { n: 'Meta Ads — Formulário de lead', cpl: [6, 14, 28], conv: 'Lead → cliente: 2% a 5%' },
  google: { n: 'Google Ads — Pesquisa', cpl: [25, 50, 90], cpc: [2.5, 4.5, 8], conv: 'Contato → cliente: 10% a 20%' },
  remk: { n: 'Remarketing', cpl: [5, 12, 22], conv: 'Contato → cliente: 5% a 12%' },
};

/* Rotina do analista */
const ROUTINE = {
  diaria: ['Responder comentários e directs (manhã e tarde)', 'Conferir posts agendados do dia', 'Checar gasto e CPL das campanhas ativas', 'Postar 3-5 stories (bastidores, enquete, prova social)', 'Registrar novos leads no CRM', 'Interagir com 10 perfis do público-alvo'],
  semanal: ['Planejar conteúdos da próxima semana', 'Gravar Reels em lote (batch)', 'Revisar criativos com CPL alto (pausar/trocar)', 'Analisar top 3 posts da semana', 'Reunião rápida com comercial sobre qualidade dos leads', 'Atualizar banco de ideias', 'Olhar perfis de concorrentes'],
  mensal: ['Fechar métricas do mês e lançar no painel', 'Gerar relatório mensal para a diretoria', 'Revisar metas e orçamento de tráfego', 'Planejar calendário do próximo mês (datas fiscais!)', 'Testar 1 formato ou funil novo', 'Atualizar portfólio de resultados', 'Backup dos dados da Central'],
};
