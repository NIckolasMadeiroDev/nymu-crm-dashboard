import dynamic from 'next/dynamic'

const ContactsManager = dynamic(() => import('../contacts/ContactsManager'), {
  ssr: false,
  loading: () => <div className="p-8 text-gray-400">Carregando contatos...</div>
})

interface ContactsManagerDashboardModalProps {
  readonly open: boolean
  readonly onClose: () => void
}

/** Modal responsivo para UI de contatos no contexto do dashboard */
export default function ContactsManagerDashboardModal({ open, onClose }: ContactsManagerDashboardModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-black/25">
      <div className="w-full max-w-4xl ml-auto h-full bg-white dark:bg-gray-900 shadow-xl animate-slide-in px-6 py-6 overflow-auto relative">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 px-2 py-1 text-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          aria-label="Fechar gestão de contatos"
        >×</button>
        <ContactsManager />
      </div>
    </div>
  )
}

