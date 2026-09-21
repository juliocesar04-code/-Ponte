import type { Metadata, Viewport } from 'next';
import './globals.css';

const description =
  'Ponte organiza serviços públicos, documentos e próximos passos em rotas claras, com fontes oficiais e progresso salvo no aparelho.';

export const metadata: Metadata = {
  title: 'Ponte — Menos portal. Mais caminho.',
  description,
  manifest: '/manifest.webmanifest',
  applicationName: 'Ponte',
  keywords: ['serviços públicos', 'GOV.BR', 'trabalho', 'educação', 'saúde', 'documentos'],
  openGraph: {
    title: 'Ponte — Menos portal. Mais caminho.',
    description,
    locale: 'pt_BR',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#b8ff5a',
  colorScheme: 'dark light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
