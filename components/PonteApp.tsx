'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  categories,
  journeys as fallbackJourneys,
  services as fallbackServices,
  type Journey,
  type Service,
  type ServiceCategory,
} from '@/data/ponte-services';
import { journeyForQuery, rankServices } from '@/domain/ponte-search';
import {
  getCurrentSession,
  listMunicipalities,
  listStates,
  loadCatalog,
  loadUserState,
  onAuthChanged,
  searchCatalog,
  signIn,
  signOut,
  signUp,
  syncLocation,
  syncProgress,
  syncSavedService,
  type IbgeMunicipality,
  type IbgeState,
  type PonteLocation,
} from '@/lib/ponte-backend';

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type ProgressMap = Record<string, boolean>;

const PROGRESS_STORAGE_KEY = 'ponte:progress:v1';
const SAVED_STORAGE_KEY = 'ponte:saved:v1';
const LOCATION_STORAGE_KEY = 'ponte:location:v1';
const CATALOG_STORAGE_KEY = 'ponte:catalog:v1';

const scenarioPresets = [
  {
    id: 'demitido',
    label: 'Fui demitido',
    query: 'fui demitido seguro desemprego carteira trabalho',
    journeyId: 'voltar-trabalho',
    code: '01',
  },
  {
    id: 'documentos',
    label: 'Organizar documentos',
    query: 'documentos beneficios cadastro inss',
    journeyId: 'organizar-vida',
    code: '02',
  },
  {
    id: 'estudos',
    label: 'Quero retomar os estudos',
    query: 'retomar estudos encceja ensino medio',
    journeyId: 'retomar-estudos',
    code: '03',
  },
  {
    id: 'saude',
    label: 'Saúde e vacinas',
    query: 'saude sus vacina exame',
    journeyId: 'organizar-vida',
    code: '04',
  },
  {
    id: 'viagem',
    label: 'Vou viajar para fora',
    query: 'viagem exterior passaporte',
    journeyId: 'viajar-exterior',
    code: '05',
  },
  {
    id: 'cidadania',
    label: 'Regularizar documentos',
    query: 'cpf identidade cin titulo eleitoral',
    journeyId: 'regularizar-cidadania',
    code: '06',
  },
] as const;

function channelLabel(channel: Service['channel']) {
  if (channel === 'digital') return 'Digital';
  if (channel === 'presencial') return 'Presencial';
  return 'Digital + presencial';
}

function sourceHealth(service: Service) {
  if (service.sourceStatus === 'ok') return { label: 'fonte verificada', tone: 'ok' };
  if (service.sourceStatus === 'redirected') return { label: 'redirecionamento oficial', tone: 'redirected' };
  if (service.sourceStatus === 'restricted') return { label: 'acesso protegido', tone: 'restricted' };
  if (service.sourceStatus === 'error') return { label: 'fonte em revisão', tone: 'error' };
  return { label: 'fonte oficial', tone: 'unknown' };
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

function ServiceCard({
  service,
  saved,
  onOpen,
  onToggleSaved,
}: {
  service: Service;
  saved: boolean;
  onOpen: (service: Service) => void;
  onToggleSaved: (serviceId: string) => void;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.22 }}
      className="service-card"
    >
      <div className="service-card__top">
        <div className="service-card__identity">
          <span className="service-card__code">{service.id.slice(0, 2).toUpperCase()}</span>
          <div>
            <span className="service-card__agency">{service.agency}</span>
            <span className="service-card__channel">{channelLabel(service.channel)}</span>
            <span className={'source-state source-state--' + sourceHealth(service).tone}>
              {sourceHealth(service).label}
            </span>
          </div>
        </div>

        <button
          className={'save-button ' + (saved ? 'is-saved' : '')}
          type="button"
          aria-label={(saved ? 'Remover ' : 'Salvar ') + service.title}
          aria-pressed={saved}
          onClick={() => onToggleSaved(service.id)}
        >
          <span aria-hidden="true">{saved ? '◆' : '◇'}</span>
        </button>
      </div>

      <div className="service-card__body">
        <h3>{service.title}</h3>
        <p>{service.summary}</p>
      </div>

      <div className="service-card__reason">
        <span>Sinal de relevância</span>
        <p>{service.why}</p>
      </div>

      <button className="service-card__cta" type="button" onClick={() => onOpen(service)}>
        <span>Preparar acesso</span>
        <span aria-hidden="true">↗</span>
      </button>
    </motion.article>
  );
}

function JourneyCard({
  journey,
  progress,
  selected,
  onSelect,
}: {
  journey: Journey;
  progress: ProgressMap;
  selected: boolean;
  onSelect: (journey: Journey) => void;
}) {
  const done = journey.steps.filter((step) => progress[step.id]).length;
  const percent = Math.round((done / journey.steps.length) * 100);

  return (
    <button
      className={
        'journey-card journey-card--' +
        journey.accent +
        (selected ? ' is-selected' : '')
      }
      type="button"
      onClick={() => onSelect(journey)}
    >
      <div className="journey-card__head">
        <span>{journey.eyebrow}</span>
        <span>{String(percent).padStart(2, '0')}%</span>
      </div>

      <div className="journey-card__copy">
        <h3>{journey.title}</h3>
        <p>{journey.description}</p>
      </div>

      <div className="journey-card__map" aria-hidden="true">
        {journey.steps.map((step, index) => (
          <span className={progress[step.id] ? 'is-done' : ''} key={step.id}>
            <i>{String(index + 1).padStart(2, '0')}</i>
          </span>
        ))}
      </div>

      <div className="journey-card__footer">
        <span>{done}/{journey.steps.length} etapas</span>
        <strong>Abrir plano <i aria-hidden="true">→</i></strong>
      </div>
    </button>
  );
}

function ServiceDrawer({
  service,
  saved,
  onToggleSaved,
  onClose,
}: {
  service: Service | null;
  saved: boolean;
  onToggleSaved: (serviceId: string) => void;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {service ? (
        <motion.div
          className="drawer-shell"
          role="dialog"
          aria-modal="true"
          aria-label={'Detalhes de ' + service.title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) onClose();
          }}
        >
          <motion.aside
            className="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 330, damping: 34 }}
          >
            <div className="drawer__toolbar">
              <div className={'verified-chip verified-chip--' + sourceHealth(service).tone}>
                <i />
                {sourceHealth(service).label}
              </div>
              <div className="drawer__actions">
                <button
                  className={'save-button save-button--drawer ' + (saved ? 'is-saved' : '')}
                  type="button"
                  onClick={() => onToggleSaved(service.id)}
                  aria-pressed={saved}
                >
                  {saved ? 'Salvo' : 'Salvar'}
                </button>
                <button className="icon-button" type="button" onClick={onClose} aria-label="Fechar detalhes">
                  ×
                </button>
              </div>
            </div>

            <div className="drawer__hero">
              <p className="eyebrow">{service.agency} · {channelLabel(service.channel)}</p>
              <h2>{service.title}</h2>
              <p>{service.summary}</p>
            </div>

            <div className="drawer__signal">
              <span>Por que entrou no seu mapa</span>
              <p>{service.why}</p>
            </div>

            <section className="drawer__section">
              <div className="drawer__section-title">
                <span>01</span>
                <h3>Prepare antes de sair do Ponte</h3>
              </div>
              <ol className="clean-list">
                {service.preparation.map((item, index) => (
                  <li key={item}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <p>{item}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section className="drawer__section">
              <div className="drawer__section-title">
                <span>02</span>
                <h3>Separe estes itens</h3>
              </div>
              <div className="tag-list">
                {service.documents.map((document) => (
                  <span key={document}>{document}</span>
                ))}
              </div>
            </section>

            <a className="official-link" href={service.officialUrl} target="_blank" rel="noreferrer">
              <span>
                <small>{service.updatedLabel}</small>
                <strong>{service.officialLabel}</strong>
              </span>
              <i aria-hidden="true">↗</i>
            </a>

            <p className="drawer__disclaimer">
              O Ponte organiza o caminho e aponta a fonte. Regras, elegibilidade, prazos e decisões
              pertencem ao órgão responsável e podem mudar.
            </p>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function CommandPalette({
  open,
  query,
  services,
  recommendedJourney,
  onQueryChange,
  onSelectService,
  onSelectJourney,
  onClose,
}: {
  open: boolean;
  query: string;
  services: Service[];
  recommendedJourney: Journey;
  onQueryChange: (value: string) => void;
  onSelectService: (service: Service) => void;
  onSelectJourney: (journey: Journey) => void;
  onClose: () => void;
}) {
  const commandInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => commandInputRef.current?.focus(), 60);
    return () => window.clearTimeout(id);
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="command-shell"
          role="dialog"
          aria-modal="true"
          aria-label="Busca rápida do Ponte"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) onClose();
          }}
        >
          <motion.div
            className="command"
            initial={{ opacity: 0, y: -18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.99 }}
          >
            <div className="command__search">
              <span aria-hidden="true">⌕</span>
              <input
                ref={commandInputRef}
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="Descreva o que você precisa resolver"
                autoComplete="off"
              />
              <kbd>ESC</kbd>
            </div>

            <div className="command__body">
              <button
                className="command__journey"
                type="button"
                onClick={() => {
                  onSelectJourney(recommendedJourney);
                  onClose();
                }}
              >
                <span>Rota sugerida</span>
                <strong>{recommendedJourney.title}</strong>
                <i aria-hidden="true">→</i>
              </button>

              <div className="command__results">
                <span className="command__label">Serviços relacionados</span>
                {services.slice(0, 5).map((service) => (
                  <button
                    type="button"
                    key={service.id}
                    onClick={() => {
                      onSelectService(service);
                      onClose();
                    }}
                  >
                    <span className="command__result-code">{service.id.slice(0, 2).toUpperCase()}</span>
                    <span>
                      <strong>{service.title}</strong>
                      <small>{service.agency} · {channelLabel(service.channel)}</small>
                    </span>
                    <i aria-hidden="true">↗</i>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function PonteApp() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'todos' | ServiceCategory>('todos');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [catalogServices, setCatalogServices] = useState<Service[]>(fallbackServices);
  const [catalogJourneys, setCatalogJourneys] = useState<Journey[]>(fallbackJourneys);
  const [remoteSearch, setRemoteSearch] = useState<Service[] | null>(null);
  const [backendState, setBackendState] = useState<'loading' | 'online' | 'fallback'>('loading');
  const [selectedJourneyId, setSelectedJourneyId] = useState(fallbackJourneys[0].id);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [savedServices, setSavedServices] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [online, setOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [locationOpen, setLocationOpen] = useState(false);
  const [location, setLocation] = useState<PonteLocation>({
    stateCode: '',
    municipalityCode: '',
    municipalityName: '',
  });
  const [states, setStates] = useState<IbgeState[]>([]);
  const [municipalities, setMunicipalities] = useState<IbgeMunicipality[]>([]);
  const [locationDraftState, setLocationDraftState] = useState('');
  const [locationDraftMunicipality, setLocationDraftMunicipality] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const storedProgress = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
      const storedSaved = window.localStorage.getItem(SAVED_STORAGE_KEY);
      const storedLocation = window.localStorage.getItem(LOCATION_STORAGE_KEY);
      const storedCatalog = window.localStorage.getItem(CATALOG_STORAGE_KEY);

      if (storedProgress) setProgress(JSON.parse(storedProgress) as ProgressMap);
      if (storedSaved) setSavedServices(JSON.parse(storedSaved) as string[]);
      if (storedLocation) {
        const parsedLocation = JSON.parse(storedLocation) as PonteLocation;
        setLocation(parsedLocation);
        setLocationDraftState(parsedLocation.stateCode);
        setLocationDraftMunicipality(parsedLocation.municipalityCode);
      }
      if (storedCatalog) {
        const parsedCatalog = JSON.parse(storedCatalog) as {
          services?: Service[];
          journeys?: Journey[];
        };
        if (parsedCatalog.services?.length) setCatalogServices(parsedCatalog.services);
        if (parsedCatalog.journeys?.length) {
          setCatalogJourneys(parsedCatalog.journeys);
          setSelectedJourneyId((current) =>
            parsedCatalog.journeys?.some((journey) => journey.id === current)
              ? current
              : parsedCatalog.journeys?.[0]?.id ?? current,
          );
        }
      }
    } catch {
      setProgress({});
      setSavedServices([]);
    } finally {
      setHydrated(true);
    }

    setOnline(window.navigator.onLine);

    loadCatalog()
      .then((catalog) => {
        setCatalogServices(catalog.services);
        setCatalogJourneys(catalog.journeys);
        setSelectedJourneyId((current) =>
          catalog.journeys.some((journey) => journey.id === current)
            ? current
            : catalog.journeys[0]?.id ?? current,
        );
        window.localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(catalog));
        setBackendState('online');
      })
      .catch(() => setBackendState('fallback'));

    listStates().then(setStates).catch(() => undefined);

    getCurrentSession().then(setSession).catch(() => undefined);
    const authListener = onAuthChanged(setSession);

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    const handleInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPrompt);
    };
    const handleKeyboard = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen((current) => !current);
      }

      if (event.key === 'Escape') {
        setCommandOpen(false);
        setSelectedService(null);
        setAuthOpen(false);
        setLocationOpen(false);
      }

      if (event.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleInstall);
    window.addEventListener('keydown', handleKeyboard);

    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleInstall);
      window.removeEventListener('keydown', handleKeyboard);
      authListener.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  }, [hydrated, progress]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(savedServices));
  }, [hydrated, savedServices]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
  }, [hydrated, location]);

  useEffect(() => {
    if (!locationDraftState) {
      setMunicipalities([]);
      return;
    }

    let cancelled = false;
    listMunicipalities(locationDraftState)
      .then((items) => {
        if (!cancelled) setMunicipalities(items);
      })
      .catch(() => {
        if (!cancelled) setMunicipalities([]);
      });

    return () => {
      cancelled = true;
    };
  }, [locationDraftState]);

  useEffect(() => {
    if (!online || backendState !== 'online') {
      setRemoteSearch(null);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      searchCatalog(query, location)
        .then((results) => {
          if (!cancelled) setRemoteSearch(results);
        })
        .catch(() => {
          if (!cancelled) setRemoteSearch(null);
        });
    }, query.trim() ? 220 : 80);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [backendState, location.municipalityCode, location.stateCode, online, query]);

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId || !hydrated) return;

    let cancelled = false;
    loadUserState(userId)
      .then(async (remote) => {
        if (cancelled) return;

        const mergedSaved = Array.from(new Set([...savedServices, ...remote.savedServices]));
        const mergedProgress: ProgressMap = { ...remote.progress };
        for (const [stepId, completed] of Object.entries(progress)) {
          mergedProgress[stepId] = Boolean(mergedProgress[stepId] || completed);
        }

        setSavedServices(mergedSaved);
        setProgress(mergedProgress);

        const nextLocation = remote.location ?? (location.stateCode ? location : null);
        if (nextLocation) {
          setLocation(nextLocation);
          setLocationDraftState(nextLocation.stateCode);
          setLocationDraftMunicipality(nextLocation.municipalityCode);
        }

        await Promise.allSettled([
          ...mergedSaved.map((serviceId) => syncSavedService(userId, serviceId, true)),
          ...Object.entries(mergedProgress)
            .filter(([, completed]) => completed)
            .map(([stepId]) => {
              const journey = catalogJourneys.find((item) =>
                item.steps.some((step) => step.id === stepId),
              );
              return journey
                ? syncProgress(userId, journey.id, stepId, true)
                : Promise.resolve();
            }),
          ...(nextLocation ? [syncLocation(userId, nextLocation)] : []),
        ]);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [session?.user.id, hydrated]);

  const localRankedServices = useMemo(
    () => rankServices(catalogServices, query),
    [catalogServices, query],
  );

  const allRankedServices = remoteSearch ?? localRankedServices;

  const rankedServices = useMemo(
    () =>
      allRankedServices.filter(
        (service) => category === 'todos' || service.category === category,
      ),
    [allRankedServices, category],
  );

  const recommendedJourney = useMemo(
    () => journeyForQuery(query, catalogJourneys),
    [catalogJourneys, query],
  );

  const selectedJourney =
    catalogJourneys.find((journey) => journey.id === selectedJourneyId) ??
    catalogJourneys[0] ??
    fallbackJourneys[0];

  const serviceById = useMemo(
    () =>
      Object.fromEntries(catalogServices.map((service) => [service.id, service])) as Record<
        string,
        Service
      >,
    [catalogServices],
  );

  const selectedDone = selectedJourney.steps.filter((step) => progress[step.id]).length;
  const selectedPercent = Math.round((selectedDone / Math.max(selectedJourney.steps.length, 1)) * 100);

  const allSteps = catalogJourneys.flatMap((journey) => journey.steps);
  const totalDone = allSteps.filter((step) => progress[step.id]).length;
  const overallPercent = Math.round((totalDone / Math.max(allSteps.length, 1)) * 100);

  function toggleStep(stepId: string) {
    const completed = !progress[stepId];
    setProgress((current) => ({ ...current, [stepId]: completed }));

    const userId = session?.user.id;
    const journey = catalogJourneys.find((item) => item.steps.some((step) => step.id === stepId));
    if (userId && journey) {
      syncProgress(userId, journey.id, stepId, completed).catch(() => undefined);
    }
  }

  function toggleSaved(serviceId: string) {
    const saved = !savedServices.includes(serviceId);
    setSavedServices((current) =>
      saved ? [...current, serviceId] : current.filter((id) => id !== serviceId),
    );

    const userId = session?.user.id;
    if (userId) syncSavedService(userId, serviceId, saved).catch(() => undefined);
  }

  function selectScenario(preset: (typeof scenarioPresets)[number]) {
    setQuery(preset.query);
    setCategory('todos');
    setSelectedJourneyId(preset.journeyId);
    window.requestAnimationFrame(() => {
      document.getElementById('servicos')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  function openJourney(journey: Journey) {
    setSelectedJourneyId(journey.id);
    document.getElementById('plano')?.scrollIntoView({ behavior: 'smooth' });
  }

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  async function handleAuthSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthMessage('');

    try {
      const result =
        authMode === 'login'
          ? await signIn(authEmail.trim(), authPassword)
          : await signUp(authEmail.trim(), authPassword);

      if (result.error) {
        setAuthMessage(result.error.message);
        return;
      }

      if (authMode === 'signup' && !result.data.session) {
        setAuthMessage('Conta criada. Confira seu e-mail para concluir a confirmação.');
        return;
      }

      setAuthOpen(false);
      setAuthEmail('');
      setAuthPassword('');
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    setSession(null);
  }

  function saveLocationPreference() {
    const state = states.find((item) => item.sigla === locationDraftState);
    const municipality = municipalities.find(
      (item) => String(item.id) === locationDraftMunicipality,
    );

    const nextLocation: PonteLocation = {
      stateCode: state?.sigla ?? locationDraftState,
      municipalityCode: municipality ? String(municipality.id) : '',
      municipalityName: municipality?.nome ?? '',
    };

    setLocation(nextLocation);
    setLocationOpen(false);

    const userId = session?.user.id;
    if (userId && nextLocation.stateCode) {
      syncLocation(userId, nextLocation).catch(() => undefined);
    }
  }

  return (
    <main>
      <div className="signal-bar">
        <span>PONTE / INFRAESTRUTURA CÍVICA DIGITAL</span>
        <span>
          {backendState === 'online' ? 'CATÁLOGO AO VIVO' : 'MODO LOCAL'} · FONTES OFICIAIS · CONTA OPCIONAL
        </span>
      </div>

      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Ponte — início">
          <BrandMark />
          <span>Ponte</span>
        </a>

        <nav aria-label="Navegação principal">
          <a href="#servicos">Serviços</a>
          <a href="#rotas">Rotas</a>
          <a href="#plano">Meu plano</a>
          <a href="#metodo">Método</a>
        </nav>

        <div className="header-actions">
          <button
            className="header-location"
            type="button"
            onClick={() => setLocationOpen(true)}
            title="Definir localização"
          >
            <span aria-hidden="true">⌖</span>
            <strong>
              {location.municipalityName
                ? location.municipalityName + ' · ' + location.stateCode
                : location.stateCode || 'Definir cidade'}
            </strong>
          </button>

          <button className="command-trigger" type="button" onClick={() => setCommandOpen(true)}>
            <span>Buscar</span>
            <kbd>⌘ K</kbd>
          </button>

          <span className={'network-status ' + (online ? 'is-online' : 'is-offline')}>
            <i />
            {online ? (backendState === 'online' ? 'ao vivo' : 'local') : 'offline'}
          </span>

          <button className="account-button" type="button" onClick={() => setAuthOpen(true)}>
            <span aria-hidden="true">{session ? '●' : '○'}</span>
            {session ? 'Sincronizado' : 'Entrar'}
          </button>

          {installPrompt ? (
            <button type="button" className="install-button" onClick={install}>
              Instalar
            </button>
          ) : null}
        </div>
      </header>

      <section className="hero" id="inicio">
        <div className="hero__grid" aria-hidden="true" />
        <div className="hero__beam hero__beam--one" aria-hidden="true" />
        <div className="hero__beam hero__beam--two" aria-hidden="true" />

        <div className="hero__layout">
          <div className="hero__copy">
            <p className="eyebrow">Navegador de serviços públicos</p>
            <h1>
              Burocracia vira
              <span>próxima ação.</span>
            </h1>
            <p className="hero__lead">
              Descreva sua situação. O Ponte cruza serviços, organiza a sequência e deixa claro o que
              você precisa preparar antes de abrir um portal oficial.
            </p>

            <div className="hero-search">
              <div className="hero-search__topline">
                <label htmlFor="service-search">O que você precisa resolver?</label>
                <span>Pressione / para buscar</span>
              </div>
              <div className="hero-search__box">
                <span aria-hidden="true">⌕</span>
                <input
                  ref={searchInputRef}
                  id="service-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Ex.: fui demitido e não sei o que fazer agora"
                  autoComplete="off"
                />
                {query ? (
                  <button type="button" onClick={() => setQuery('')} aria-label="Limpar busca">
                    limpar
                  </button>
                ) : (
                  <button type="button" onClick={() => setCommandOpen(true)}>
                    explorar
                  </button>
                )}
              </div>
            </div>

            <div className="scenario-row" aria-label="Situações comuns">
              {scenarioPresets.map((preset) => (
                <button type="button" key={preset.id} onClick={() => selectScenario(preset)}>
                  <span>{preset.code}</span>
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <aside className="decision-card">
            <div className="decision-card__head">
              <span>RESOLVER AGORA</span>
              <span className="live-dot"><i /> sistema ativo</span>
            </div>

            <div className="decision-card__route">
              <span className="decision-card__index">{recommendedJourney.eyebrow}</span>
              <h2>{recommendedJourney.title}</h2>
              <p>{recommendedJourney.description}</p>
            </div>

            <div className="decision-card__services">
              <span>Primeiros sinais encontrados</span>
              {allRankedServices.slice(0, 3).map((service, index) => (
                <button type="button" key={service.id} onClick={() => setSelectedService(service)}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{service.title}</strong>
                  <i aria-hidden="true">↗</i>
                </button>
              ))}
            </div>

            <button className="primary-action" type="button" onClick={() => openJourney(recommendedJourney)}>
              Abrir rota sugerida
              <span aria-hidden="true">→</span>
            </button>
          </aside>
        </div>

        <div className="hero-status">
          <div>
            <span className="hero-status__label">MAPEAMENTO</span>
            <strong>{String(catalogServices.length).padStart(2, '0')}</strong>
            <p>serviços oficiais nesta versão</p>
          </div>
          <div>
            <span className="hero-status__label">ROTAS</span>
            <strong>{String(catalogJourneys.length).padStart(2, '0')}</strong>
            <p>jornadas conectadas</p>
          </div>
          <div>
            <span className="hero-status__label">PROGRESSO</span>
            <strong>{String(overallPercent).padStart(2, '0')}%</strong>
            <p>do seu mapa concluído</p>
          </div>
          <div>
            <span className="hero-status__label">SALVOS</span>
            <strong>{String(savedServices.length).padStart(2, '0')}</strong>
            <p>serviços guardados no aparelho</p>
          </div>
        </div>
      </section>

      <section className="workspace-strip" aria-label="Como o Ponte trabalha">
        <div>
          <span>01 / DESCREVER</span>
          <strong>Fale da situação, não do órgão.</strong>
        </div>
        <div>
          <span>02 / CRUZAR</span>
          <strong>O Ponte conecta serviços e dependências.</strong>
        </div>
        <div>
          <span>03 / EXECUTAR</span>
          <strong>Você sai com ordem, documentos e fonte.</strong>
        </div>
      </section>

      <section className="section services-section" id="servicos">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Mapa de serviços</p>
            <h2>Descubra pelo problema. Não pelo nome do portal.</h2>
          </div>
          <div className="section-heading__aside">
            <p>
              A busca combina intenção, contexto e termos relacionados. Cada resultado explica por que
              apareceu e qual canal oficial você deve usar.
            </p>
            <button type="button" onClick={() => setCommandOpen(true)}>
              Abrir busca rápida <span>⌘ K</span>
            </button>
          </div>
        </div>

        <div className="catalog-toolbar">
          <div className="category-row" role="group" aria-label="Filtrar por categoria">
            {categories.map((item) => (
              <button
                type="button"
                key={item.id}
                className={category === item.id ? 'is-active' : ''}
                onClick={() => setCategory(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="catalog-count">
            <span>{rankedServices.length}</span>
            resultados
          </div>
        </div>

        <motion.div layout className="services-grid">
          <AnimatePresence mode="popLayout">
            {rankedServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                saved={savedServices.includes(service.id)}
                onOpen={setSelectedService}
                onToggleSaved={toggleSaved}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {rankedServices.length === 0 ? (
          <div className="empty-state">
            <span>00</span>
            <div>
              <h3>Nenhum encaixe claro.</h3>
              <p>Tente descrever a situação com outras palavras. Ex.: “perdi o emprego” em vez de “MTE”.</p>
            </div>
            <button type="button" onClick={() => setCommandOpen(true)}>Refazer busca</button>
          </div>
        ) : null}
      </section>

      <section className="section routes-section" id="rotas">
        <div className="section-heading section-heading--dark">
          <div>
            <p className="eyebrow">Rotas conectadas</p>
            <h2>Um serviço resolve uma etapa. Uma rota resolve a jornada.</h2>
          </div>
          <div className="section-heading__aside">
            <p>
              O plano persiste no navegador. Você pode fechar, voltar depois e continuar exatamente
              do ponto em que parou.
            </p>
            <div className="local-chip"><i /> dados locais no dispositivo</div>
          </div>
        </div>

        <div className="journeys-grid">
          {catalogJourneys.map((journey) => (
            <JourneyCard
              key={journey.id}
              journey={journey}
              progress={progress}
              selected={journey.id === selectedJourney.id}
              onSelect={openJourney}
            />
          ))}
        </div>
      </section>

      <section className="section plan-section" id="plano">
        <div className="plan-heading">
          <div>
            <p className="eyebrow">Central de execução</p>
            <h2>Meu plano</h2>
          </div>
          <div className="plan-heading__progress">
            <span>{selectedJourney.eyebrow}</span>
            <strong>{String(selectedPercent).padStart(2, '0')}%</strong>
          </div>
        </div>

        <div className="plan-shell">
          <aside className="plan-sidebar">
            <div>
              <span className="plan-sidebar__status"><i /> rota ativa</span>
              <h3>{selectedJourney.title}</h3>
              <p>{selectedJourney.description}</p>
            </div>

            <div className="plan-meter">
              <div>
                <span>progresso</span>
                <strong>{selectedDone}/{selectedJourney.steps.length}</strong>
              </div>
              <div className="plan-meter__track">
                <span style={{ width: selectedPercent + '%' }} />
              </div>
            </div>

            <div className="route-switcher">
              <span>Trocar rota</span>
              {catalogJourneys.map((journey) => (
                <button
                  key={journey.id}
                  className={journey.id === selectedJourney.id ? 'is-active' : ''}
                  onClick={() => setSelectedJourneyId(journey.id)}
                  type="button"
                >
                  <span>{journey.eyebrow}</span>
                  <strong>{journey.title}</strong>
                  <i aria-hidden="true">→</i>
                </button>
              ))}
            </div>
          </aside>

          <div className="steps">
            {selectedJourney.steps.map((step, index) => {
              const linkedService = step.serviceId ? serviceById[step.serviceId] : undefined;
              const isDone = Boolean(progress[step.id]);

              return (
                <article className={'step ' + (isDone ? 'is-done' : '')} key={step.id}>
                  <button
                    type="button"
                    className="step__check"
                    aria-label={(isDone ? 'Desmarcar ' : 'Marcar ') + step.title}
                    aria-pressed={isDone}
                    onClick={() => toggleStep(step.id)}
                  >
                    <span>{isDone ? '✓' : String(index + 1).padStart(2, '0')}</span>
                  </button>

                  <div className="step__content">
                    <div className="step__copy">
                      <span className="eyebrow">{isDone ? 'Concluído' : 'Próxima ação'}</span>
                      <h3>{step.title}</h3>
                      <p>{step.detail}</p>
                    </div>

                    {linkedService ? (
                      <button
                        className="step__service"
                        type="button"
                        onClick={() => setSelectedService(linkedService)}
                      >
                        <span>Serviço conectado</span>
                        <strong>{linkedService.title}</strong>
                        <i aria-hidden="true">↗</i>
                      </button>
                    ) : (
                      <div className="step__local">
                        <span>Ação local</span>
                        <strong>Sem portal externo</strong>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="method-section" id="metodo">
        <div className="method-section__intro">
          <p className="eyebrow">Método Ponte</p>
          <h2>Menos clique cego. Mais contexto antes da ação.</h2>
        </div>

        <div className="method-grid">
          <article>
            <span>01</span>
            <h3>Fonte antes de opinião</h3>
            <p>O caminho termina em canal oficial. O Ponte não substitui a decisão do órgão.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Explicação antes do clique</h3>
            <p>Você entende por que um serviço apareceu e o que preparar antes de abrir outro site.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Privacidade por padrão</h3>
            <p>Sem conta, tudo fica no navegador. Com conta opcional, progresso, cidade e itens salvos sincronizam entre dispositivos.</p>
          </article>
          <article>
            <span>04</span>
            <h3>Continuidade</h3>
            <p>Rotas persistentes reduzem recomeços e transformam burocracia em tarefas verificáveis.</p>
          </article>
        </div>
      </section>

      <footer className="site-footer">
        <div className="site-footer__brand">
          <a className="brand brand--footer" href="#inicio">
            <BrandMark />
            <span>Ponte</span>
          </a>
          <p>Infraestrutura de navegação para serviços públicos brasileiros.</p>
        </div>

        <div className="site-footer__meta">
          <span>PROTÓTIPO FUNCIONAL / 2026</span>
          <p>
            O Ponte não concede benefícios, não substitui atendimento oficial e não pede pagamento
            para acessar serviços públicos.
          </p>
        </div>
      </footer>

      <AnimatePresence>
        {authOpen ? (
          <motion.div
            className="utility-shell"
            role="dialog"
            aria-modal="true"
            aria-label="Conta Ponte"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.currentTarget === event.target) setAuthOpen(false);
            }}
          >
            <motion.div
              className="utility-panel"
              initial={{ opacity: 0, y: 18, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.99 }}
            >
              <div className="utility-panel__head">
                <div>
                  <span>CONTA OPCIONAL</span>
                  <h2>{session ? 'Sincronização ativa' : 'Leve seu plano com você.'}</h2>
                </div>
                <button type="button" onClick={() => setAuthOpen(false)} aria-label="Fechar">×</button>
              </div>

              {session ? (
                <div className="account-state">
                  <div>
                    <span>Conectado como</span>
                    <strong>{session.user.email ?? 'Conta Ponte'}</strong>
                  </div>
                  <p>Serviços salvos, progresso e localização são sincronizados com sua conta. O catálogo continua público.</p>
                  <button
                    type="button"
                    className="utility-submit utility-submit--secondary"
                    onClick={async () => {
                      await handleSignOut();
                      setAuthOpen(false);
                    }}
                  >
                    Sair da conta
                  </button>
                </div>
              ) : (
                <>
                  <div className="utility-tabs">
                    <button
                      type="button"
                      className={authMode === 'login' ? 'is-active' : ''}
                      onClick={() => {
                        setAuthMode('login');
                        setAuthMessage('');
                      }}
                    >
                      Entrar
                    </button>
                    <button
                      type="button"
                      className={authMode === 'signup' ? 'is-active' : ''}
                      onClick={() => {
                        setAuthMode('signup');
                        setAuthMessage('');
                      }}
                    >
                      Criar conta
                    </button>
                  </div>

                  <form className="utility-form" onSubmit={handleAuthSubmit}>
                    <label className="utility-field">
                      <span>E-mail</span>
                      <input
                        type="email"
                        value={authEmail}
                        onChange={(event) => setAuthEmail(event.target.value)}
                        autoComplete="email"
                        required
                      />
                    </label>
                    <label className="utility-field">
                      <span>Senha</span>
                      <input
                        type="password"
                        value={authPassword}
                        onChange={(event) => setAuthPassword(event.target.value)}
                        autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                        minLength={6}
                        required
                      />
                    </label>
                    <button className="utility-submit" type="submit" disabled={authBusy}>
                      {authBusy ? 'Processando…' : authMode === 'login' ? 'Entrar e sincronizar' : 'Criar conta'}
                    </button>
                    {authMessage ? <p className="utility-message">{authMessage}</p> : null}
                  </form>

                  <p className="utility-note">
                    A conta é opcional. Sem login, o Ponte continua funcionando e salva o plano neste aparelho.
                  </p>
                </>
              )}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {locationOpen ? (
          <motion.div
            className="utility-shell"
            role="dialog"
            aria-modal="true"
            aria-label="Localização do Ponte"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.currentTarget === event.target) setLocationOpen(false);
            }}
          >
            <motion.div
              className="utility-panel utility-panel--location"
              initial={{ opacity: 0, y: 18, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.99 }}
            >
              <div className="utility-panel__head">
                <div>
                  <span>CONTEXTO LOCAL</span>
                  <h2>Onde você quer resolver?</h2>
                </div>
                <button type="button" onClick={() => setLocationOpen(false)} aria-label="Fechar">×</button>
              </div>

              <div className="utility-form">
                <label className="utility-field">
                  <span>Estado</span>
                  <select
                    value={locationDraftState}
                    onChange={(event) => {
                      setLocationDraftState(event.target.value);
                      setLocationDraftMunicipality('');
                    }}
                  >
                    <option value="">Todos os estados</option>
                    {states.map((state) => (
                      <option key={state.id} value={state.sigla}>
                        {state.nome} · {state.sigla}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="utility-field">
                  <span>Município</span>
                  <select
                    value={locationDraftMunicipality}
                    onChange={(event) => setLocationDraftMunicipality(event.target.value)}
                    disabled={!locationDraftState}
                  >
                    <option value="">Todo o estado</option>
                    {municipalities.map((municipality) => (
                      <option key={municipality.id} value={municipality.id}>
                        {municipality.nome}
                      </option>
                    ))}
                  </select>
                </label>

                <button className="utility-submit" type="button" onClick={saveLocationPreference}>
                  Aplicar contexto local
                </button>
              </div>

              <p className="utility-note">
                O município ajuda o Ponte a priorizar serviços estaduais e municipais. Nenhuma localização precisa é coletada.
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <CommandPalette
        open={commandOpen}
        query={query}
        services={allRankedServices}
        recommendedJourney={recommendedJourney}
        onQueryChange={setQuery}
        onSelectService={setSelectedService}
        onSelectJourney={openJourney}
        onClose={() => setCommandOpen(false)}
      />

      <ServiceDrawer
        service={selectedService}
        saved={selectedService ? savedServices.includes(selectedService.id) : false}
        onToggleSaved={toggleSaved}
        onClose={() => setSelectedService(null)}
      />
    </main>
  );
}
