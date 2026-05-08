'use client';

import { useState } from 'react';
import { workflows as workflowsApi, type WorkflowSummary } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface CreateWorkflowModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (w: WorkflowSummary) => void;
}

export function CreateWorkflowModal({ open, onClose, onCreate }: CreateWorkflowModalProps) {
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
      setName('');
      setDescription('');
      onCreate(w);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workflow');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Workflow">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="wf-name" className="text-xs font-medium text-[#8B949E] uppercase tracking-wide">
            Name <span className="text-[#F85149]">*</span>
          </label>
          <input
            id="wf-name"
            type="text"
            placeholder="My workflow"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            className="w-full h-9 px-3 text-sm bg-[#0D1117] text-[#E6EDF3] placeholder:text-[#484F58] border border-[#30363D] rounded-md outline-none focus:border-[#388BFD] focus:shadow-[0_0_0_3px_rgba(56,139,253,0.15)] transition-all"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="wf-desc" className="text-xs font-medium text-[#8B949E] uppercase tracking-wide">Description</label>
          <input
            id="wf-desc"
            type="text"
            placeholder="Optional description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full h-9 px-3 text-sm bg-[#0D1117] text-[#E6EDF3] placeholder:text-[#484F58] border border-[#30363D] rounded-md outline-none focus:border-[#388BFD] focus:shadow-[0_0_0_3px_rgba(56,139,253,0.15)] transition-all"
          />
        </div>

        {error && <p className="text-sm text-[#F85149]">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading} disabled={!name.trim()}>
            Create →
          </Button>
        </div>
      </form>
    </Modal>
  );
}
