'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import type { DashboardFilters } from '@/types/dashboard'
import { sharingService } from '@/services/sharing/sharing-service'

interface ShareButtonProps {
  readonly filters: DashboardFilters
  readonly className?: string
}

export default function ShareButton({ filters, className = '' }: Readonly<ShareButtonProps>) {
  const [isSharing, setIsSharing] = useState(false)
  const [shareLink, setShareLink] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  const handleShare = () => {
    setIsSharing(true)
    const link = sharingService.createShareLink(filters, 30, 100)
    const url = sharingService.getShareUrl(link.token)
    setShareLink(url)
    setShowModal(true)
    setIsSharing(false)
  }

  const copyToClipboard = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink)
      toast.success('Link copiado para a área de transferência!')
    }
  }

  return (
    <>
      <button
        onClick={handleShare}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleShare()
          }
        }}
        disabled={isSharing}
        aria-label="Compartilhar dashboard"
        aria-busy={isSharing}
        className={`w-full px-2 sm:px-2 md:px-2 py-1.5 sm:py-1.5 md:py-1.5 text-[10px] sm:text-[11px] md:text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-secondary flex items-center justify-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 whitespace-nowrap min-w-0 ${className}`}
      >
        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        <span className="hidden sm:inline truncate">Compartilhar</span>
      </button>

      {showModal && shareLink && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 hover:bg-black/60"
            onClick={() => {
              setShowModal(false)
              setShareLink(null)
            }}
            aria-hidden="true"
          />
          <dialog
            open
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent"
            aria-modal="true"
            aria-labelledby="share-modal-title"
            onCancel={() => {
              setShowModal(false)
              setShareLink(null)
            }}
          >
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-2 sm:mx-4">
              <h3 id="share-modal-title" className="text-base sm:text-lg font-bold font-primary mb-3 sm:mb-4">
                Link Compartilhável
              </h3>
              <div className="mb-4">
                <p className="text-xs sm:text-sm text-gray-600 font-secondary mb-2">
                  Compartilhe este link para permitir que outros vejam o dashboard
                  com os mesmos filtros:
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm font-secondary min-w-0"
                  />
                  <button
                    onClick={copyToClipboard}
                    aria-label="Copiar link para área de transferência"
                    className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 whitespace-nowrap"
                  >
                    Copiar
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowModal(false)
                  setShareLink(null)
                }}
                aria-label="Fechar modal de compartilhamento"
                className="w-full px-4 py-2 text-sm sm:text-base bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-secondary focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Fechar
              </button>
            </div>
          </dialog>
        </>
      )}
    </>
  )
}

