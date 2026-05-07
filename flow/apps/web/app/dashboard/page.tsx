'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { workflows as workflowsApi, type WorkflowSummary } from '@/lib/api';
import { useAuthStore } from '@/store';
import styles from './dashboard.module.css';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function WorkflowCard({
  workflow,
  onDelete,
  onToggle,
}: {
  workflow: WorkflowSummary;
  onDelete: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const router = useRouter();

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${workflow.name}"?`)) return;
    setDeleting(true);
    try { await onDelete(workflow.id); }
    finally { setDeleting(false); }
  }

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setToggling(true);
    try { await onToggle(workflow.id, !workflow.isActive); }
    finally { setToggling(false); }
  }

  return (
    <div className={styles.card} onClick={() => router.push(`/workflows/${workflow.id}`)}>
      <div className={styles.cardTop}>
        <div className={styles.cardIcon}>
          {workflow.isActive ? '⚡' : '⏸'}
        </div>
        <span className={`${styles.badge} ${workflow.isActive ? styles.badgeActive : styles.badgeInactive}`}>
          {workflow.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <h3 className={styles.cardName}>{workflow.name}</h3>
      {workflow.description && (
        <p className={styles.cardDesc}>{workflow.description}</p>
      )}
      <p className={styles.cardDate}>Updated {formatDate(workflow.updatedAt)}</p>

      <div className={styles.cardActions}>
        <Link
          href={`/workflows/${workflow.id}`}
          className={styles.btnOpen}
          onClick={(e) => e.stopPropagation()}
        >
          Open Canvas
        </Link>
        <Link
          href={`/workflows/${workflow.id}/runs`}
          className={styles.btnSecondary}
          onClick={(e) => e.stopPropagation()}
        >
          Runs
        </Link>
        <button
          className={`${styles.btnToggle} ${workflow.isActive ? styles.btnDeactivate : styles.btnActivate}`}
          onClick={handleToggle}
          disabled={toggling}
          title={workflow.isActive ? 'Deactivate' : 'Activate'}
        >
          {toggling ? '…' : (workflow.isActive ? '⏸' : '▶')}
        </button>
        <button
          className={styles.btnDelete}
          onClick={handleDelete}
          disabled={deleting}
          title="Delete workflow"
        >
          {deleting ? '…' : '🗑'}
        </button>
      </div>
    </div>
  );
}

function CreateModal({ onClose, onCreate }: { onClose: () => void; onCreate: (w: WorkflowSummary) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      const w = await workflowsApi.create(name.trim(), description.trim() || undefined);
      onCreate(w);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>New Workflow</h2>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.field}>
            <label htmlFor="wf-name">Name *</label>
            <input
              id="wf-name"
              type="text"
              placeholder="My Automation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="wf-desc">Description</label>
            <input
              id="wf-desc"
              type="text"
              placeholder="Optional description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.modalActions}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.btnCreate} disabled={loading || !name.trim()}>
              {loading ? 'Creating…' : 'Create Workflow'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, clearAuth } = useAuthStore();
  const [wfList, setWfList] = useState<WorkflowSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    workflowsApi.list()
      .then(setWfList)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, router]);

  const handleDelete = useCallback(async (id: string) => {
    await workflowsApi.delete(id);
    setWfList((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const handleToggle = useCallback(async (id: string, active: boolean) => {
    const updated = await workflowsApi.update(id, { isActive: active });
    setWfList((prev) => prev.map((w) => w.id === id ? { ...w, isActive: updated.isActive } : w));
  }, []);

  const handleCreated = useCallback((w: WorkflowSummary) => {
    setShowCreate(false);
    router.push(`/workflows/${w.id}`);
  }, [router]);

  function handleLogout() {
    clearAuth();
    router.push('/login');
  }

  return (
    <div className={styles.page}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.logo}>⚡ Flow</Link>
        <nav className={styles.nav}>
          <span className={`${styles.navItem} ${styles.navActive}`}>
            <span>📊</span> Dashboard
          </span>
        </nav>
        <div className={styles.sidebarBottom}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>{user?.email?.[0]?.toUpperCase() ?? 'U'}</div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user?.username || user?.email?.split('@')[0]}</span>
              <span className={styles.userEmail}>{user?.email}</span>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout} title="Sign out">↪</button>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.heading}>Workflows</h1>
            <p className={styles.headingSub}>
              {wfList.length} workflow{wfList.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button id="new-workflow-btn" className={styles.newBtn} onClick={() => setShowCreate(true)}>
            <span>+</span> New Workflow
          </button>
        </div>

        {loading ? (
          <div className={styles.grid}>
            {[1,2,3].map((i) => (
              <div key={i} className={`${styles.card} ${styles.skeleton}`} style={{ height: 200 }} />
            ))}
          </div>
        ) : wfList.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🔧</div>
            <h2>No workflows yet</h2>
            <p>Create your first automation workflow to get started.</p>
            <button className={styles.newBtn} onClick={() => setShowCreate(true)}>
              + Create your first workflow
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {wfList.map((w) => (
              <WorkflowCard
                key={w.id}
                workflow={w}
                onDelete={handleDelete}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}
      </main>

      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreated} />
      )}
    </div>
  );
}
