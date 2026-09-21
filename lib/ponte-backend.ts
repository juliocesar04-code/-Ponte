import { createClient, type Session } from '@supabase/supabase-js';
import type { Journey, Service } from '@/data/ponte-services';

const SUPABASE_URL = 'https://rkxtrevywowqmgbjqwko.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable___KQzIViXDWdR5yjIFF4nA_iSnO-8iO';

export const ponteSupabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

type ServiceRow = {
  id: string;
  title: string;
  summary: string;
  category: Service['category'];
  agency: string;
  channel: Service['channel'];
  official_url: string;
  official_label: string;
  keywords: string[];
  documents: string[];
  preparation: string[];
  why: string;
  updated_label: string;
  scope: NonNullable<Service['scope']>;
  source_status: NonNullable<Service['sourceStatus']>;
  source_checked_at: string | null;
};

type JourneyRow = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  accent: Journey['accent'];
  priority: number;
};

type JourneyStepRow = {
  id: string;
  journey_id: string;
  position: number;
  title: string;
  detail: string;
  service_id: string | null;
};

export type PonteLocation = {
  stateCode: string;
  municipalityCode: string;
  municipalityName: string;
};

export type IbgeState = {
  id: number;
  sigla: string;
  nome: string;
};

export type IbgeMunicipality = {
  id: number;
  nome: string;
};

function mapService(row: ServiceRow): Service {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    category: row.category,
    agency: row.agency,
    channel: row.channel,
    officialUrl: row.official_url,
    officialLabel: row.official_label,
    keywords: row.keywords ?? [],
    documents: row.documents ?? [],
    preparation: row.preparation ?? [],
    why: row.why,
    updatedLabel: row.updated_label,
    scope: row.scope,
    sourceStatus: row.source_status,
    sourceCheckedAt: row.source_checked_at,
  };
}

export async function loadCatalog(): Promise<{ services: Service[]; journeys: Journey[] }> {
  const [{ data: serviceRows, error: serviceError }, { data: journeyRows, error: journeyError }, { data: stepRows, error: stepError }] =
    await Promise.all([
      ponteSupabase
        .from('ponte_services')
        .select('id,title,summary,category,agency,channel,official_url,official_label,keywords,documents,preparation,why,updated_label,scope,source_status,source_checked_at')
        .eq('active', true)
        .order('title'),
      ponteSupabase
        .from('ponte_journeys')
        .select('id,eyebrow,title,description,accent,priority')
        .eq('active', true)
        .order('priority'),
      ponteSupabase
        .from('ponte_journey_steps')
        .select('id,journey_id,position,title,detail,service_id')
        .order('position'),
    ]);

  if (serviceError) throw serviceError;
  if (journeyError) throw journeyError;
  if (stepError) throw stepError;

  const mappedServices = ((serviceRows ?? []) as ServiceRow[]).map(mapService);
  const mappedJourneys = ((journeyRows ?? []) as JourneyRow[]).map((journey) => ({
    id: journey.id,
    eyebrow: journey.eyebrow,
    title: journey.title,
    description: journey.description,
    accent: journey.accent,
    steps: ((stepRows ?? []) as JourneyStepRow[])
      .filter((step) => step.journey_id === journey.id)
      .sort((a, b) => a.position - b.position)
      .map((step) => ({
        id: step.id,
        title: step.title,
        detail: step.detail,
        serviceId: step.service_id ?? undefined,
      })),
  }));

  return { services: mappedServices, journeys: mappedJourneys };
}

export async function searchCatalog(
  query: string,
  location?: Partial<PonteLocation>,
): Promise<Service[]> {
  const { data, error } = await ponteSupabase.rpc('ponte_search_services', {
    search_query: query,
    filter_state: location?.stateCode || null,
    filter_municipality: location?.municipalityCode || null,
    result_limit: 40,
  });

  if (error) throw error;

  return ((data ?? []) as Array<ServiceRow & { score: number }>).map(mapService);
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data } = await ponteSupabase.auth.getSession();
  return data.session;
}

export function onAuthChanged(callback: (session: Session | null) => void) {
  return ponteSupabase.auth.onAuthStateChange((_event, session) => callback(session));
}

export async function signIn(email: string, password: string) {
  return ponteSupabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string) {
  return ponteSupabase.auth.signUp({ email, password });
}

export async function signOut() {
  return ponteSupabase.auth.signOut();
}

export async function loadUserState(userId: string) {
  const [saved, progress, preferences] = await Promise.all([
    ponteSupabase.from('ponte_saved_services').select('service_id').eq('user_id', userId),
    ponteSupabase.from('ponte_progress').select('step_id,completed').eq('user_id', userId),
    ponteSupabase.from('ponte_user_preferences').select('state_code,municipality_code,municipality_name').eq('user_id', userId).maybeSingle(),
  ]);

  if (saved.error) throw saved.error;
  if (progress.error) throw progress.error;
  if (preferences.error) throw preferences.error;

  return {
    savedServices: (saved.data ?? []).map((row) => row.service_id as string),
    progress: Object.fromEntries(
      (progress.data ?? []).map((row) => [row.step_id as string, Boolean(row.completed)]),
    ) as Record<string, boolean>,
    location: preferences.data?.state_code
      ? {
          stateCode: preferences.data.state_code,
          municipalityCode: preferences.data.municipality_code ?? '',
          municipalityName: preferences.data.municipality_name ?? '',
        }
      : null,
  };
}

export async function syncSavedService(userId: string, serviceId: string, saved: boolean) {
  if (saved) {
    const { error } = await ponteSupabase
      .from('ponte_saved_services')
      .upsert({ user_id: userId, service_id: serviceId });
    if (error) throw error;
    return;
  }

  const { error } = await ponteSupabase
    .from('ponte_saved_services')
    .delete()
    .eq('user_id', userId)
    .eq('service_id', serviceId);
  if (error) throw error;
}

export async function syncProgress(
  userId: string,
  journeyId: string,
  stepId: string,
  completed: boolean,
) {
  const { error } = await ponteSupabase.from('ponte_progress').upsert({
    user_id: userId,
    journey_id: journeyId,
    step_id: stepId,
    completed,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function syncLocation(userId: string, location: PonteLocation) {
  const { error } = await ponteSupabase.from('ponte_user_preferences').upsert({
    user_id: userId,
    state_code: location.stateCode,
    municipality_code: location.municipalityCode || null,
    municipality_name: location.municipalityName || null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function listStates(): Promise<IbgeState[]> {
  const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
  if (!response.ok) throw new Error('Não foi possível carregar os estados.');
  return response.json() as Promise<IbgeState[]>;
}

export async function listMunicipalities(stateCode: string): Promise<IbgeMunicipality[]> {
  const response = await fetch(
    `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${encodeURIComponent(stateCode)}/municipios?orderBy=nome`,
  );
  if (!response.ok) throw new Error('Não foi possível carregar os municípios.');
  return response.json() as Promise<IbgeMunicipality[]>;
}
