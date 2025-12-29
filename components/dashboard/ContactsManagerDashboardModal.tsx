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
    <>
      <button 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 cursor-default" 
        onClick={onClose}
        aria-label="Fechar modal"
        type="button"
      ></button>
      
      <div className="fixed inset-4 md:inset-8 lg:inset-12 bg-white dark:bg-gray-900 rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header com botão de fechar */}
        <div className="flex items-center justify-end p-3 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
        
        {/* Conteúdo */}
        <div className="flex-1 overflow-auto">
          <ContactsManager />
        </div>
      </div>
    </>
  )
}

