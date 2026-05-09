import type { Metadata } from 'next';
import { MarketingNav } from '@/components/marketing/MarketingNav';

export const metadata: Metadata = {
  title: {
    template: '%s — Flow',
    default: 'Flow — Visual Workflow Automation',
  },
  description:
    'Design automations as node graphs, trigger them from anywhere, and watch them execute in real time.',
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#080B11', color: '#E6EDF3', minHeight: '100vh' }}>
      <MarketingNav />
      {children}
    </div>
  );
}
