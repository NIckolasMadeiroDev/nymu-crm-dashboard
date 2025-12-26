import React from 'react'

// Placeholder tipado, extensível para contatos paginados
import { HelenaContact } from '@/services/helena/helena-contacts-service'

type Contact = HelenaContact & {
  id: string
  name: string
  phoneNumber: string
  email?: string | null
  status: string
}

interface ContactsTableProps {
  contacts: Contact[]
  isLoading?: boolean
  onRowClick?: (contact: Contact) => void
}

export default function ContactsTable({ contacts, isLoading, onRowClick }: ContactsTableProps) {
  if (isLoading) {
    return <div className="w-full flex justify-center items-center py-16">Carregando...</div>
  }

  if (!contacts.length) {
    return <div className="w-full flex justify-center items-center py-16 text-gray-400">Nenhum contato encontrado</div>
  }

  return (
    <div className="overflow-x-auto rounded bg-white dark:bg-gray-900 border">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="p-2 border-b text-left font-semibold">Nome</th>
            <th className="p-2 border-b text-left font-semibold">Telefone</th>
            <th className="p-2 border-b text-left font-semibold">E-mail</th>
            <th className="p-2 border-b text-left font-semibold">Status</th>
            <th className="p-2 border-b"></th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((c) => (
            <tr
              key={c.id}
              className="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer group"
              onClick={() => onRowClick?.(c)}
            >
              <td className="p-2 border-b font-medium group-hover:underline">{c.name}</td>
              <td className="p-2 border-b">{c.phoneNumber}</td>
              <td className="p-2 border-b">{c.email || '-'}</td>
              <td className="p-2 border-b">{c.status}</td>
              <td className="p-2 border-b text-right text-gray-400">&#x25B6;</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

