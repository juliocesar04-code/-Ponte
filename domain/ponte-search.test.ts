import { describe, expect, it } from 'vitest';
import type { Journey, Service } from '../data/ponte-services';
import { journeyForQuery, normalizeSearch, rankServices } from './ponte-search';

const journey = (id: string, title = id): Journey => ({
  id,
  eyebrow: id,
  title,
  description: '',
  accent: 'lime',
  steps: [],
});

const journeyList: Journey[] = [
  journey('voltar-trabalho'),
  journey('organizar-vida'),
  journey('retomar-estudos'),
  journey('viajar-exterior'),
  journey('regularizar-cidadania'),
  journey('reduzir-contas'),
  journey('empreender-mei'),
];

const service = (overrides: Partial<Service> & Pick<Service, 'id' | 'title'>): Service => ({
  id: overrides.id,
  title: overrides.title,
  summary: overrides.summary ?? '',
  category: overrides.category ?? 'documentos',
  agency: overrides.agency ?? 'Órgão',
  channel: overrides.channel ?? 'digital',
  officialUrl: overrides.officialUrl ?? 'https://www.gov.br',
  officialLabel: overrides.officialLabel ?? 'Fonte oficial',
  keywords: overrides.keywords ?? [],
  documents: overrides.documents ?? [],
  preparation: overrides.preparation ?? [],
  why: overrides.why ?? '',
  updatedLabel: overrides.updatedLabel ?? 'Fonte oficial',
  scope: overrides.scope,
  sourceStatus: overrides.sourceStatus,
  sourceCheckedAt: overrides.sourceCheckedAt,
});

describe('Ponte search domain', () => {
  it('normalizes accents and case for intent matching', () => {
    expect(normalizeSearch('  TÍTULO Eleitoral  ')).toBe('titulo eleitoral');
  });

  it('ranks a direct title/keyword match ahead of unrelated services', () => {
    const result = rankServices(
      [
        service({
          id: 'passaporte',
          title: 'Passaporte',
          keywords: ['viagem', 'exterior'],
        }),
        service({
          id: 'cadunico',
          title: 'Cadastro Único',
          keywords: ['renda', 'beneficio'],
        }),
      ],
      'quero viajar para o exterior',
    );

    expect(result[0]?.id).toBe('passaporte');
  });

  it.each([
    ['fui demitido ontem', 'voltar-trabalho'],
    ['quero abrir um MEI', 'empreender-mei'],
    ['preciso tirar passaporte', 'viajar-exterior'],
    ['minha conta de luz está alta', 'reduzir-contas'],
    ['quero voltar a estudar pelo Encceja', 'retomar-estudos'],
    ['preciso regularizar meu CPF', 'regularizar-cidadania'],
    ['quero consultar meu SUS', 'organizar-vida'],
  ])('maps "%s" to %s', (query, expectedJourney) => {
    expect(journeyForQuery(query, journeyList).id).toBe(expectedJourney);
  });
});
