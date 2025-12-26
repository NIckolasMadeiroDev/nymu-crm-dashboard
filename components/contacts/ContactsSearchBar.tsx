import React from 'react'

interface ContactsSearchBarProps {
  value: string
  onChange: (value: string) => void
  onSearch: () => void
}

export default function ContactsSearchBar({ value, onChange, onSearch }: ContactsSearchBarProps) {
  return (
    <div className="flex gap-2 w-full items-center">
      <input
        className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
        value={value}
        placeholder="Buscar por nome, telefone, email..."
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') onSearch()
        }}
      />
      <button
        className="px-4 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
        onClick={onSearch}
      >Buscar</button>
    </div>
  )
}

