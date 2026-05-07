'use client';

import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.hero}>
      <div className={styles.bg} />
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⚡</span>
          <span>Flow</span>
        </div>
        <div className={styles.navLinks}>
          <Link href="/login" className={styles.navLink}>Sign in</Link>
          <Link href="/signup" className={styles.navCta}>Get started</Link>
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.badge}>Visual Workflow Automation</div>
        <h1 className={styles.headline}>
          Build powerful<br />
          <span className={styles.gradient}>automations</span><br />
          visually
        </h1>
        <p className={styles.sub}>
          Design, connect, and run automated workflows with a drag-and-drop canvas.
          Webhooks, cron jobs, HTTP actions, and real-time execution logs — all in one place.
        </p>
        <div className={styles.actions}>
          <Link href="/signup" className={styles.ctaPrimary}>
            Start building for free
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
          <Link href="/login" className={styles.ctaSecondary}>Sign in</Link>
        </div>

        <div className={styles.featureGrid}>
          {[
            { icon: '🎨', title: 'Visual Canvas', desc: 'Drag & drop nodes to build your workflow graph' },
            { icon: '⚡', title: 'Real-time Execution', desc: 'Watch each step execute live with status indicators' },
            { icon: '🔗', title: 'Webhooks & Cron', desc: 'Trigger workflows via HTTP or on a schedule' },
            { icon: '📊', title: 'Execution History', desc: 'Full step-by-step logs for every run' },
          ].map((f) => (
            <div key={f.title} className={styles.featureCard}>
              <span className={styles.featureIcon}>{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
