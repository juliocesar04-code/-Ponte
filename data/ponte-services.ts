export type ServiceCategory = 'documentos' | 'trabalho' | 'renda' | 'saude' | 'educacao' | 'previdencia';

export type Service = {
  id: string;
  title: string;
  summary: string;
  category: ServiceCategory;
  agency: string;
  channel: 'digital' | 'hibrido' | 'presencial';
  officialUrl: string;
  officialLabel: string;
  keywords: string[];
  documents: string[];
  preparation: string[];
  why: string;
  updatedLabel: string;
};

export type JourneyStep = {
  id: string;
  title: string;
  detail: string;
  serviceId?: string;
};

export type Journey = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  accent: 'lime' | 'blue' | 'orange';
  steps: JourneyStep[];
};

export const categories: Array<{ id: 'todos' | ServiceCategory; label: string }> = [
  { id: 'todos', label: 'Tudo' },
  { id: 'documentos', label: 'Documentos' },
  { id: 'trabalho', label: 'Trabalho' },
  { id: 'renda', label: 'Renda' },
  { id: 'saude', label: 'Saúde' },
  { id: 'educacao', label: 'Educação' },
  { id: 'previdencia', label: 'Previdência' },
];

export const services: Service[] = [
  {
    id: 'cadunico',
    title: 'Cadastro Único',
    summary: 'Organize o cadastro usado por diferentes políticas e programas sociais.',
    category: 'renda',
    agency: 'MDS',
    channel: 'hibrido',
    officialUrl: 'https://www.gov.br/mds/pt-br/acoes-e-programas/cadastro-unico',
    officialLabel: 'Página oficial do Cadastro Único',
    keywords: ['cadunico', 'cadastro unico', 'beneficio', 'renda', 'cras', 'nis'],
    documents: ['CPF', 'Documento de identificação', 'Comprovante de residência quando disponível'],
    preparation: ['Confira os dados das pessoas da família', 'Localize o CRAS ou posto responsável no município', 'Use somente canais oficiais para confirmar regras atuais'],
    why: 'Aparece quando a busca envolve renda, benefícios, NIS ou organização do cadastro familiar.',
    updatedLabel: 'Fonte oficial revisada',
  },
  {
    id: 'ctps-digital',
    title: 'Carteira de Trabalho Digital',
    summary: 'Consulte vínculos, dados trabalhistas e serviços ligados à vida profissional.',
    category: 'trabalho',
    agency: 'MTE',
    channel: 'digital',
    officialUrl: 'https://www.gov.br/pt-br/temas/carteira-de-trabalho-digital',
    officialLabel: 'Carteira de Trabalho Digital no GOV.BR',
    keywords: ['carteira', 'trabalho', 'ctps', 'emprego', 'contrato', 'vinculo'],
    documents: ['CPF', 'Conta GOV.BR'],
    preparation: ['Tenha acesso à conta GOV.BR', 'Revise seus vínculos antes de usar os dados em processos', 'Se houver divergência, siga a orientação do canal oficial'],
    why: 'Aparece para buscas sobre emprego, vínculo, contrato, carteira profissional ou retorno ao mercado.',
    updatedLabel: 'Canal federal',
  },
  {
    id: 'seguro-desemprego',
    title: 'Seguro-Desemprego',
    summary: 'Entenda o pedido, os documentos e o acompanhamento do benefício.',
    category: 'trabalho',
    agency: 'MTE',
    channel: 'digital',
    officialUrl: 'https://www.gov.br/pt-br/servicos/solicitar-o-seguro-desemprego',
    officialLabel: 'Solicitar Seguro-Desemprego no GOV.BR',
    keywords: ['seguro', 'desemprego', 'demissao', 'demitido', 'parcela', 'trabalho'],
    documents: ['CPF', 'Requerimento do Seguro-Desemprego quando aplicável'],
    preparation: ['Confirme se seu caso atende às regras vigentes', 'Separe o requerimento recebido na dispensa quando exigido', 'Acompanhe o pedido pelo canal oficial'],
    why: 'Aparece quando a busca indica desligamento, desemprego ou necessidade de organizar a transição entre empregos.',
    updatedLabel: 'Serviço oficial GOV.BR',
  },
  {
    id: 'meu-inss',
    title: 'Meu INSS',
    summary: 'Centralize requerimentos, extratos, consultas e acompanhamento previdenciário.',
    category: 'previdencia',
    agency: 'INSS',
    channel: 'digital',
    officialUrl: 'https://www.gov.br/pt-br/temas/meu-inss',
    officialLabel: 'Meu INSS — serviços digitais',
    keywords: ['inss', 'aposentadoria', 'beneficio', 'cnis', 'previdencia', 'auxilio'],
    documents: ['CPF', 'Conta GOV.BR', 'Documentos específicos do serviço solicitado'],
    preparation: ['Confira seus dados cadastrais', 'Identifique o serviço exato antes de enviar documentos', 'Guarde número de protocolo e acompanhe exigências'],
    why: 'Aparece para aposentadoria, benefícios, CNIS, requerimentos e acompanhamento previdenciário.',
    updatedLabel: 'Portal oficial do INSS',
  },
  {
    id: 'meu-sus',
    title: 'Meu SUS Digital',
    summary: 'Acesse informações de saúde, vacinação e documentos disponíveis na rede integrada.',
    category: 'saude',
    agency: 'Ministério da Saúde',
    channel: 'digital',
    officialUrl: 'https://www.gov.br/saude/pt-br/composicao/seidigi/meususdigital',
    officialLabel: 'Meu SUS Digital',
    keywords: ['sus', 'saude', 'vacina', 'exame', 'cns', 'cartao sus', 'medicamento'],
    documents: ['CPF', 'Conta GOV.BR'],
    preparation: ['Entre com sua conta GOV.BR', 'Confira se os dados exibidos correspondem ao seu cadastro', 'Para emissão ou correção cadastral do CNS, confirme a orientação oficial atual'],
    why: 'Aparece quando a busca envolve SUS, vacinação, histórico de saúde, exames ou Cartão Nacional de Saúde.',
    updatedLabel: 'Ministério da Saúde',
  },
  {
    id: 'encceja',
    title: 'Encceja',
    summary: 'Organize o caminho para certificação de competências do ensino fundamental ou médio.',
    category: 'educacao',
    agency: 'Inep',
    channel: 'digital',
    officialUrl: 'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/encceja',
    officialLabel: 'Encceja — Inep',
    keywords: ['encceja', 'estudo', 'certificado', 'ensino medio', 'ensino fundamental', 'prova'],
    documents: ['CPF', 'Dados pessoais atualizados', 'Acesso aos canais indicados no edital vigente'],
    preparation: ['Confira o edital e o calendário do ano', 'Defina a certificação pretendida', 'Guarde comprovantes e acompanhe a Página do Participante'],
    why: 'Aparece quando a busca envolve retomar estudos, certificação ou conclusão do ensino fundamental ou médio.',
    updatedLabel: 'Inep',
  },
  {
    id: 'pe-de-meia',
    title: 'Pé-de-Meia',
    summary: 'Consulte informações e elegibilidade do incentivo educacional pelos canais oficiais.',
    category: 'educacao',
    agency: 'MEC',
    channel: 'digital',
    officialUrl: 'https://www.gov.br/pt-br/servicos/consultar-elegibilidade-para-o-programa-pe-de-meia',
    officialLabel: 'Consultar elegibilidade — Pé-de-Meia',
    keywords: ['pe de meia', 'estudante', 'ensino medio', 'educacao', 'beneficio', 'escola'],
    documents: ['CPF', 'Conta GOV.BR'],
    preparation: ['Consulte a elegibilidade no canal oficial', 'Confira matrícula e dados cadastrais', 'Não pague intermediários para consultar o programa'],
    why: 'Aparece em buscas sobre permanência no ensino médio, incentivo educacional e consulta de elegibilidade.',
    updatedLabel: 'Serviço oficial GOV.BR',
  },
];

export const journeys: Journey[] = [
  {
    id: 'voltar-trabalho',
    eyebrow: 'Rota 01',
    title: 'Voltar ao mercado',
    description: 'Uma sequência para organizar sua situação profissional sem pular documentos e canais importantes.',
    accent: 'lime',
    steps: [
      { id: 'conta', title: 'Garanta acesso ao GOV.BR', detail: 'Recupere senha e confira seus dados antes de depender de qualquer serviço.' },
      { id: 'ctps', title: 'Revise a Carteira de Trabalho Digital', detail: 'Cheque vínculos e informações profissionais.', serviceId: 'ctps-digital' },
      { id: 'seguro', title: 'Cheque o Seguro-Desemprego', detail: 'Se houve dispensa, veja se o benefício se aplica ao seu caso.', serviceId: 'seguro-desemprego' },
      { id: 'curriculo', title: 'Organize currículo e comprovantes', detail: 'Deixe histórico profissional e documentos prontos para candidaturas.' },
    ],
  },
  {
    id: 'organizar-vida',
    eyebrow: 'Rota 02',
    title: 'Organizar documentos e benefícios',
    description: 'Conecta cadastro familiar, saúde e previdência em uma lista executável e salva no aparelho.',
    accent: 'blue',
    steps: [
      { id: 'cad', title: 'Revise o Cadastro Único', detail: 'Confirme se dados da família e contatos precisam de atualização.', serviceId: 'cadunico' },
      { id: 'sus', title: 'Confira o Meu SUS Digital', detail: 'Valide o que já está disponível no seu histórico e documentos de saúde.', serviceId: 'meu-sus' },
      { id: 'inss', title: 'Confira sua situação no Meu INSS', detail: 'Veja extratos, requerimentos e pendências que façam sentido para você.', serviceId: 'meu-inss' },
      { id: 'pasta', title: 'Monte uma pasta de protocolos', detail: 'Guarde comprovantes, números e datas para não recomeçar toda vez.' },
    ],
  },
  {
    id: 'retomar-estudos',
    eyebrow: 'Rota 03',
    title: 'Retomar os estudos',
    description: 'Um caminho curto para quem quer concluir etapas e entender quais programas oficiais podem entrar na rota.',
    accent: 'orange',
    steps: [
      { id: 'objetivo', title: 'Defina o objetivo de formação', detail: 'Conclusão escolar, certificação ou retorno ao ensino regular.' },
      { id: 'encceja', title: 'Confira o Encceja', detail: 'Veja calendário, edital e requisitos do ciclo atual.', serviceId: 'encceja' },
      { id: 'incentivo', title: 'Consulte incentivos aplicáveis', detail: 'Use os canais oficiais para verificar elegibilidade.', serviceId: 'pe-de-meia' },
      { id: 'agenda', title: 'Transforme datas em tarefas', detail: 'Salve inscrições, documentos e provas como etapas concretas.' },
    ],
  },
];

export const serviceById = Object.fromEntries(services.map((service) => [service.id, service])) as Record<string, Service>;
