'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import {
  categories,
  journeys,
  serviceById,
  services,
  type Journey,
  type Service,
  type ServiceCategory,
} from '@/data/ponte-services';

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type ProgressMap = Record<string, boolean>;

const STORAGE_KEY = 'ponte:progress:v1';

function normalize(value: string) {
  return value
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function score(service: Service, rawQuery: string) {
  const query = normalize(rawQuery);
  if (!query) return 1;

  const tokens = query.split(/\s+/).filter(Boolean);
  const title = normalize(service.title);
  const haystack = normalize(
    [service.title, service.summary, service.agency, service.category, ...service.keywords].join(' ')
  );

  return tokens.reduce((total, token) => {
    if (title === token) return total + 12;
    if (title.startsWith(token)) return total + 8;
    if (title.includes(token)) return total + 6;
    if (haystack.includes(token)) return total + 3;
    return total;
  }, 0);
}

function channelLabel(channel: Service['channel']) {
  if (channel === 'digital') return 'Digital';
  if (channel === 'presencial') return 'Presencial';
  return 'Digital + presencial';
}

function ServiceCard({
  service,
  onOpen,
}: {
  service: Service;
  onOpen: (service: Service) => void;
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
        <span className="service-card__index">{service.id.slice(0, 2).toUpperCase()}</span>
        <span className="pill">{channelLabel(service.channel)}</span>
      </div>

      <div>
        <p className="eyebrow">{service.agency}</p>
        <h3>{service.title}</h3>
        <p className="service-card__summary">{service.summary}</p>
      </div>

      <div className="service-card__why">
        <span>Por que apareceu</span>
        <p>{service.why}</p>
      </div>

      <button className="text-button" type="button" onClick={() => onOpen(service)}>
        Ver preparo e fonte
        <span aria-hidden="true">→</span>
      </button>
    </motion.article>
  );
}

function JourneyCard({
  journey,
  progress,
  onSelect,
}: {
  journey: Journey;
  progress: ProgressMap;
  onSelect: (journey: Journey) => void;
}) {
  const done = journey.steps.filter((step) => progress[step.id]).length;
  const percent = Math.round((done / journey.steps.length) * 100);

  return (
    <button className={'journey-card journey-card--' + journey.accent} type="button" onClick={() => onSelect(journey)}>
      <div className="journey-card__meta">
        <span>{journey.eyebrow}</span>
        <span>{done}/{journey.steps.length}</span>
      </div>
      <h3>{journey.title}</h3>
      <p>{journey.description}</p>
      <div className="progress" aria-label={percent + '% concluído'}>
        <span style={{ width: percent + '%' }} />
      </div>
      <div className="journey-card__footer">
        <span>{percent}% da rota</span>
        <span>abrir →</span>
      </div>
    </button>
  );
}

function ServiceDrawer({
  service,
  onClose,
}: {
  service: Service | null;
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
            <div className="drawer__head">
              <div>
                <p className="eyebrow">{service.agency} · {service.updatedLabel}</p>
                <h2>{service.title}</h2>
              </div>
              <button className="icon-button" type="button" onClick={onClose} aria-label="Fechar detalhes">
                ×
              </button>
            </div>

            <p className="drawer__lead">{service.summary}</p>

            <section className="drawer__section">
              <p className="eyebrow">Antes de abrir o serviço</p>
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
              <p className="eyebrow">Separe</p>
              <div className="tag-list">
                {service.documents.map((document) => (
                  <span key={document}>{document}</span>
                ))}
              </div>
            </section>

            <div className="source-card">
              <div>
                <span>Fonte externa</span>
                <strong>Domínio oficial GOV.BR</strong>
              </div>
              <a href={service.officialUrl} target="_blank" rel="noreferrer">
                {service.officialLabel}
                <span aria-hidden="true">↗</span>
              </a>
            </div>

            <p className="fine-print">
              O Ponte organiza o caminho e aponta a fonte. Regras, elegibilidade, prazos e decisões
              pertencem ao órgão responsável e podem mudar.
            </p>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function PonteApp() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'todos' | ServiceCategory>('todos');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedJourneyId, setSelectedJourneyId] = useState(journeys[0].id);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [hydrated, setHydrated] = useState(false);
  const [online, setOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setProgress(JSON.parse(stored) as ProgressMap);
    } catch {
      setProgress({});
    } finally {
      setHydrated(true);
    }

    setOnline(window.navigator.onLine);

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    const handleInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPrompt);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleInstall);

    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleInstall);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [hydrated, progress]);

  const rankedServices = useMemo(() => {
    return services
      .map((service) => ({ service, score: score(service, query) }))
      .filter(({ service, score: serviceScore }) => {
        const categoryMatch = category === 'todos' || service.category === category;
        const queryMatch = !query.trim() || serviceScore > 0;
        return categoryMatch && queryMatch;
      })
      .sort((a, b) => b.score - a.score)
      .map(({ service }) => service);
  }, [category, query]);

  const selectedJourney =
    journeys.find((journey) => journey.id === selectedJourneyId) ?? journeys[0];

  const selectedDone = selectedJourney.steps.filter((step) => progress[step.id]).length;

  function toggleStep(stepId: string) {
    setProgress((current) => ({ ...current, [stepId]: !current[stepId] }));
  }

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Ponte — início">
          <span className="brand__mark" aria-hidden="true"><i /><i /><i /></span>
          <span>Ponte</span>
        </a>

        <nav aria-label="Navegação principal">
          <a href="#servicos">Serviços</a>
          <a href="#rotas">Rotas</a>
          <a href="#plano">Meu plano</a>
        </nav>

        <div className="header-actions">
          <span className={'network-status ' + (online ? 'is-online' : 'is-offline')}>
            <i />
            {online ? 'conectado' : 'modo offline'}
          </span>
          {installPrompt ? (
            <button type="button" className="install-button" onClick={install}>
              Instalar
            </button>
          ) : null}
        </div>
      </header>

      <section className="hero" id="inicio">
        <div className="hero__grid" aria-hidden="true" />
        <div className="hero__rail" aria-hidden="true"><span /><span /><span /><span /></div>

        <div className="hero__copy">
          <p className="eyebrow">Serviços públicos em uma rota que faz sentido</p>
          <h1>
            Menos portal.
            <span>Mais caminho.</span>
          </h1>
          <p className="hero__lead">
            O Ponte encontra serviços, explica por que eles aparecem e transforma burocracia em
            próximos passos que ficam salvos no seu aparelho.
          </p>
        </div>

        <div className="search-panel">
          <label htmlFor="service-search">O que você precisa resolver?</label>
          <div className="search-box">
            <span aria-hidden="true">⌕</span>
            <input
              id="service-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ex.: perdi o emprego, quero voltar a estudar..."
              autoComplete="off"
            />
            {query ? (
              <button type="button" onClick={() => setQuery('')} aria-label="Limpar busca">
                limpar
              </button>
            ) : null}
          </div>
          <div className="search-panel__footer">
            <span>{rankedServices.length} caminhos relacionados</span>
            <span>fontes oficiais · progresso local · offline</span>
          </div>
        </div>

        <div className="hero__metrics">
          <div><strong>07</strong><span>serviços mapeados nesta versão</span></div>
          <div><strong>03</strong><span>rotas conectadas</span></div>
          <div><strong>01</strong><span>plano salvo no dispositivo</span></div>
        </div>
      </section>

      <section className="section" id="servicos">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Descobrir</p>
            <h2>Encontre sem adivinhar o nome do serviço.</h2>
          </div>
          <p>
            A busca cruza tema, intenção e palavras relacionadas. O resultado sempre mostra o motivo
            da sugestão antes de mandar você para fora do app.
          </p>
        </div>

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

        <motion.div layout className="services-grid">
          <AnimatePresence mode="popLayout">
            {rankedServices.map((service) => (
              <ServiceCard key={service.id} service={service} onOpen={setSelectedService} />
            ))}
          </AnimatePresence>
        </motion.div>

        {rankedServices.length === 0 ? (
          <div className="empty-state">
            <span>00</span>
            <div>
              <h3>Nenhum encaixe claro.</h3>
              <p>Tente descrever a situação em vez do nome do órgão.</p>
            </div>
          </div>
        ) : null}
      </section>

      <section className="section routes-section" id="rotas">
        <div className="section-heading section-heading--light">
          <div>
            <p className="eyebrow">Rotas conectadas</p>
            <h2>Serviço isolado não resolve uma jornada.</h2>
          </div>
          <p>
            Cada rota agrupa preparação, serviço e acompanhamento. Você pode sair do app e voltar
            depois: as etapas concluídas continuam marcadas.
          </p>
        </div>

        <div className="journeys-grid">
          {journeys.map((journey) => (
            <JourneyCard
              key={journey.id}
              journey={journey}
              progress={progress}
              onSelect={(item) => {
                setSelectedJourneyId(item.id);
                document.getElementById('plano')?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          ))}
        </div>
      </section>

      <section className="section plan-section" id="plano">
        <div className="plan-shell">
          <div className="plan-sidebar">
            <p className="eyebrow">Meu plano</p>
            <h2>{selectedJourney.title}</h2>
            <p>{selectedJourney.description}</p>

            <div className="plan-score">
              <strong>{selectedDone}/{selectedJourney.steps.length}</strong>
              <span>etapas concluídas</span>
            </div>

            <div className="route-switcher">
              {journeys.map((journey) => (
                <button
                  key={journey.id}
                  className={journey.id === selectedJourney.id ? 'is-active' : ''}
                  onClick={() => setSelectedJourneyId(journey.id)}
                  type="button"
                >
                  <span>{journey.eyebrow}</span>
                  {journey.title}
                </button>
              ))}
            </div>
          </div>

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
                    {isDone ? '✓' : String(index + 1).padStart(2, '0')}
                  </button>

                  <div className="step__content">
                    <div>
                      <span className="eyebrow">{isDone ? 'Concluído' : 'Próxima ação'}</span>
                      <h3>{step.title}</h3>
                      <p>{step.detail}</p>
                    </div>

                    {linkedService ? (
                      <button className="step__service" type="button" onClick={() => setSelectedService(linkedService)}>
                        <span>Serviço conectado</span>
                        <strong>{linkedService.title}</strong>
                        <i aria-hidden="true">→</i>
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="trust-strip" aria-label="Princípios do Ponte">
        <div>
          <span>01</span>
          <strong>Fonte antes de opinião</strong>
          <p>Links apontam para canais oficiais e deixam claro quando a decisão é do órgão.</p>
        </div>
        <div>
          <span>02</span>
          <strong>Explicação antes do clique</strong>
          <p>Você entende por que um serviço apareceu antes de abrir outro portal.</p>
        </div>
        <div>
          <span>03</span>
          <strong>Privacidade por padrão</strong>
          <p>O progresso desta versão fica no próprio navegador, sem pedir CPF ou cadastro.</p>
        </div>
      </section>

      <footer className="site-footer">
        <div>
          <a className="brand brand--footer" href="#inicio">
            <span className="brand__mark" aria-hidden="true"><i /><i /><i /></span>
            <span>Ponte</span>
          </a>
          <p>Um navegador de caminhos públicos — não um intermediário do governo.</p>
        </div>
        <p className="fine-print">
          Protótipo funcional. O Ponte não concede benefícios, não substitui atendimento oficial e
          não pede pagamento para acessar serviços públicos.
        </p>
      </footer>

      <ServiceDrawer service={selectedService} onClose={() => setSelectedService(null)} />
    </main>
  );
}
