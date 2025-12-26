import React from 'react'

interface ContactDetailsDrawerProps {
  open: boolean
  contact: any
  onClose: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export default function ContactDetailsDrawer({ open, contact, onClose, onEdit, onDelete }: ContactDetailsDrawerProps) {
  // Placeholder de drawer/side-panel (pode evoluir para modal, etc)
  if (!open) return null
  if (!contact) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-25 z-40 flex">
      {/* Side panel */}
      <div className="bg-white dark:bg-gray-950 shadow-xl w-full max-w-md ml-auto h-full flex flex-col p-6 animate-slide-in">
        <button onClick={onClose} className="self-end text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-3">&times;</button>
        <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">Contato</h2>
        <div className="flex flex-col gap-2 text-gray-800 dark:text-gray-200">
          <span><b>Nome:</b> {contact.name}</span>
          <span><b>Telefone:</b> {contact.phoneNumber}</span>
          <span><b>E-mail:</b> {contact.email || '-'}</span>
          <span><b>Status:</b> {contact.status}</span>
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={onEdit} className="rounded bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2">Editar</button>
          <button onClick={onDelete} className="rounded bg-red-500 hover:bg-red-700 text-white px-4 py-2">Excluir</button>
        </div>
      </div>
    </div>
  )
}

