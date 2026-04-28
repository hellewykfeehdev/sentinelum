import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sentinelum — Human Oversight Proof for AI Decisions',
  description:
    'Generate cryptographic evidence of human oversight for critical AI decisions with timestamps, reviewer identity, immutable hashes, signed PDFs and audit-ready API logs.',
  openGraph: {
    title: 'Sentinelum proves who stayed in control when AI makes decisions.',
    description:
      'Cryptographic certificates for human-reviewed AI decisions, built for regulated and sensitive workflows.',
    type: 'website'
  },
  icons: {
    icon: '/icon.svg'
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
