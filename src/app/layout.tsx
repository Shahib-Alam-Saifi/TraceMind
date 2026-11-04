import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'TraceMind — Incident Intelligence',
  description: 'An incident investigation workspace with persistent Hindsight memory.',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
