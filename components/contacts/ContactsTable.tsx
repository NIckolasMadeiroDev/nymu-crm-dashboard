import React from 'react'
import { HelenaContact } from '@/services/helena/helena-contacts-service'
import { formatPhoneNumber } from '@/utils/format-phone'

interface ContactsTableProps {
  readonly contacts: HelenaContact[]
  readonly isLoading?: boolean
  readonly onRowClick?: (contact: HelenaContact) => void
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: 'Ativo', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    ARCHIVED: { label: 'Arquivado', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
    BLOCKED: { label: 'Bloqueado', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  }

  const config = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

export default function ContactsTable({ contacts, isLoading, onRowClick }: ContactsTableProps) {
  if (isLoading) {
    return (
      <div className="w-full flex flex-col justify-center items-center py-16 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-gray-500 dark:text-gray-400">Carregando contatos...</p>
      </div>
    )
  }

  if (!contacts.length) {
    return (
      <div className="w-full flex flex-col justify-center items-center py-16 space-y-3">
        <svg className="w-16 h-16 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p className="text-gray-400 dark:text-gray-500 font-medium">Nenhum contato encontrado</p>
        <p className="text-sm text-gray-400 dark:text-gray-600">Tente ajustar os filtros ou criar um novo contato</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Versão Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Contato
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Telefone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                E-mail
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tags
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {contacts.map((contact) => (
              <tr
                key={contact.id}
                onClick={() => onRowClick?.(contact)}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                        <span className="text-indigo-600 dark:text-indigo-300 font-medium text-sm">
                          {contact.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {contact.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-300 font-mono">
                    {formatPhoneNumber(contact.phoneNumber)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {contact.email || <span className="text-gray-300 dark:text-gray-600">-</span>}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(contact.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {contact.tags && contact.tags.length > 0 ? (
                      contact.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor: tag.bgColor || '#e5e7eb',
                            color: tag.textColor || '#374151',
                          }}
                        >
                          {tag.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                    {contact.tags && contact.tags.length > 2 && (
                      <span className="text-xs text-gray-400">+{contact.tags.length - 2}</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Versão Mobile */}
      <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
        {contacts.map((contact) => (
          <button
            key={contact.id}
            onClick={() => onRowClick?.(contact)}
            className="w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                  <span className="text-indigo-600 dark:text-indigo-300 font-medium">
                    {contact.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {contact.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                    {formatPhoneNumber(contact.phoneNumber)}
                  </p>
                </div>
              </div>
              {getStatusBadge(contact.status)}
            </div>
            {contact.email && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 truncate">
                {contact.email}
              </p>
            )}
            {contact.tags && contact.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {contact.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    style={{
                      backgroundColor: tag.bgColor || '#e5e7eb',
                      color: tag.textColor || '#374151',
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

