import React, { useState, useEffect } from "react";
import { HelenaContact } from '@/services/helena/helena-contacts-service';

interface ContactEditDrawerProps {
  open: boolean;
  loading?: boolean;
  contact?: Partial<HelenaContact>;
  mode: 'create' | 'edit';
  onSubmit: (data: Partial<HelenaContact>) => void;
  onClose: () => void;
}

export default function ContactEditDrawer({ open, loading, contact, mode, onSubmit, onClose }: ContactEditDrawerProps) {
  const [form, setForm] = useState<Partial<HelenaContact>>({});

  useEffect(() => {
    if (open) setForm(contact || {})
  }, [contact, open])

  function handleChange<K extends keyof HelenaContact>(field: K, value: any) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(form);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-25 z-40 flex">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-950 shadow-xl w-full max-w-md ml-auto h-full flex flex-col p-6 animate-slide-in">
        <button onClick={onClose} type="button" className="self-end text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-3">&times;</button>
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{mode === 'create' ? 'Novo Contato' : 'Editar Contato'}</h2>
        <div className="flex flex-col gap-2 text-gray-800 dark:text-gray-200 flex-1">
          <label>
            Nome:
            <input className="w-full px-2 py-1 border rounded mt-0.5" value={form.name || ''} onChange={e => handleChange('name', e.target.value)} required />
          </label>
          <label>
            Telefone:
            <input className="w-full px-2 py-1 border rounded mt-0.5" value={form.phoneNumber || ''} onChange={e => handleChange('phoneNumber', e.target.value)} required />
          </label>
          <label>
            E-mail:
            <input className="w-full px-2 py-1 border rounded mt-0.5" value={form.email || ''} onChange={e => handleChange('email', e.target.value)} />
          </label>
        </div>
        <div className="flex gap-2 mt-8">
          <button type="submit" disabled={loading} className="rounded bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-medium disabled:opacity-60">
            {mode === 'create' ? 'Criar' : 'Salvar'}
          </button>
          <button type="button" onClick={onClose} className="rounded bg-gray-300 hover:bg-gray-400 text-gray-900 px-4 py-2 font-medium">Cancelar</button>
        </div>
      </form>
    </div>
  )
}

