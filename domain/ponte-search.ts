import type { Journey, Service } from '../data/ponte-services';

export function normalizeSearch(value: string) {
  return value
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function scoreService(service: Service, rawQuery: string) {
  const query = normalizeSearch(rawQuery);
  if (!query) return 1;

  const tokens = query.split(/\s+/).filter((token) => token.length >= 2);
  const title = normalizeSearch(service.title);
  const haystack = normalizeSearch(
    [service.title, service.summary, service.agency, service.category, ...service.keywords].join(' '),
  );

  return tokens.reduce((total, token) => {
    if (title === token) return total + 14;
    if (title.startsWith(token)) return total + 9;
    if (title.includes(token)) return total + 7;
    if (haystack.includes(token)) return total + 3;
    return total;
  }, 0);
}

export function rankServices(serviceList: Service[], rawQuery: string) {
  return serviceList
    .map((service) => ({ service, score: scoreService(service, rawQuery) }))
    .filter(({ score }) => !rawQuery.trim() || score > 0)
    .sort((a, b) => b.score - a.score || a.service.title.localeCompare(b.service.title, 'pt-BR'))
    .map(({ service }) => service);
}

function findJourney(journeyList: Journey[], id: string, fallback: Journey) {
  return journeyList.find((journey) => journey.id === id) ?? fallback;
}

export function journeyForQuery(rawQuery: string, journeyList: Journey[]): Journey {
  const query = normalizeSearch(rawQuery);
  const fallback = journeyList[0];

  if (!fallback) {
    throw new Error('Ponte requires at least one journey.');
  }

  if (
    ['demit', 'emprego', 'trabalho', 'carteira', 'seguro', 'contrato'].some((term) =>
      query.includes(term),
    )
  ) {
    return findJourney(journeyList, 'voltar-trabalho', fallback);
  }

  if (
    ['mei', 'microempreendedor', 'cnpj', 'empreender', 'negocio', 'nota fiscal', 'nfse'].some(
      (term) => query.includes(term),
    )
  ) {
    return findJourney(journeyList, 'empreender-mei', fallback);
  }

  if (
    ['conta de luz', 'energia', 'tarifa social', 'gas do povo', 'reduzir conta', 'despesa'].some(
      (term) => query.includes(term),
    )
  ) {
    return findJourney(journeyList, 'reduzir-contas', fallback);
  }

  if (
    ['estud', 'encceja', 'ensino', 'escola', 'certific', 'fies', 'faculdade'].some((term) =>
      query.includes(term),
    )
  ) {
    return findJourney(journeyList, 'retomar-estudos', fallback);
  }

  if (
    ['passaporte', 'viagem', 'exterior', 'internacional'].some((term) => query.includes(term))
  ) {
    return findJourney(journeyList, 'viajar-exterior', fallback);
  }

  if (
    ['cpf', 'identidade', 'cin', 'titulo', 'eleitoral', 'cidadania'].some((term) =>
      query.includes(term),
    )
  ) {
    return findJourney(journeyList, 'regularizar-cidadania', fallback);
  }

  if (
    ['sus', 'saude', 'vacina', 'beneficio', 'cadastro', 'documento', 'inss', 'bpc'].some(
      (term) => query.includes(term),
    )
  ) {
    return findJourney(journeyList, 'organizar-vida', fallback);
  }

  return fallback;
}
