'use client'

import { useState, useEffect } from 'react'
import { helenaServiceFactory } from '@/services/helena/helena-service-factory'
import PanelViewModal from './PanelViewModal'
import PanelEditModal from './PanelEditModal'

interface PanelStep {
  id?: string
  title: string
  position: number
  isInitial: boolean
  isFinal: boolean
  archived?: boolean
  color?: string
  cardCount?: number
  overdueCardCount?: number
  monetaryAmount?: number
}

interface Panel {
  id: string
  title: string
  description: string
  key: string
  scope: string
  departmentIds: string[] | null
  overdueCardCount: number
  archived: boolean
  createdAt: string
  updatedAt: string
  steps?: PanelStep[]
}

interface PanelsManagerModalProps {
  readonly open: boolean
  readonly onClose: () => void
}

export default function PanelsManagerModal({ open, onClose }: PanelsManagerModalProps) {
  const [panels, setPanels] = useState<Panel[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPanel, setSelectedPanel] = useState<Panel | null>(null)
  const [showPanelView, setShowPanelView] = useState(false)
  const [showPanelEdit, setShowPanelEdit] = useState(false)
  const [editingPanel, setEditingPanel] = useState<Panel | null>(null)

  useEffect(() => {
    if (open) {
      fetchPanels()
    }
  }, [open])

  const fetchPanels = async () => {
    setIsLoading(true)
    try {
      const panelsService = helenaServiceFactory.getPanelsService()
      const data = await panelsService.getPanelsWithDetails()
      setPanels(data as Panel[])
    } catch (error) {
      console.error('Erro ao carregar painéis:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredPanels = panels.filter(panel =>
    !panel.archived && (
      panel.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      panel.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      panel.key.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const handleOpenPanel = (panel: Panel) => {
    setSelectedPanel(panel)
    setShowPanelView(true)
  }

  const handleClosePanelView = () => {
    setShowPanelView(false)
    setSelectedPanel(null)
  }

  const handleCreatePanel = () => {
    setEditingPanel(null)
    setShowPanelEdit(true)
  }

  const handleEditPanel = (panel: Panel) => {
    setEditingPanel(panel)
    setShowPanelEdit(true)
  }

  const handleClosePanelEdit = () => {
    setShowPanelEdit(false)
    setEditingPanel(null)
  }

  const handleSavePanel = () => {
    fetchPanels()
  }

  const getDepartmentBadges = (departmentIds: string[] | null) => {
    if (!departmentIds || departmentIds.length === 0) return null
    
    const departmentNames: Record<string, string> = {
      '3201bc59-5485-4329-b6ed-be82ce80b300': 'Prospecção',
      '1f8600af-a81f-4b60-a20d-c4da46f40bbb': 'Fechamento',
      '60a9cc35-d3b9-472b-87ce-4450518fca49': 'Operacional',
      '5f1842fd-6f9e-4529-8c1a-9c922cbefcee': 'Geral'
    }

    return departmentIds.map(id => departmentNames[id] || 'Outro').join(', ')
  }

  if (!open) return null

  return (
    <>
      <button 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 cursor-default" 
        onClick={onClose}
        aria-label="Fechar modal"
        type="button"
      ></button>
      
      <div className="fixed inset-4 md:inset-8 lg:inset-16 bg-white dark:bg-gray-900 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-primary">
              Painéis
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-secondary">
              Controle suas vendas, crie funis, tarefas e atividades
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search and Actions */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar painéis..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-secondary"
              />
              <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              onClick={handleCreatePanel}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap shadow-sm font-secondary"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Novo Painel
            </button>
          </div>
        </div>

        {/* Panels Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          )}

          {!isLoading && filteredPanels.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              <p className="text-lg font-medium">Nenhum painel encontrado</p>
              <p className="text-sm mt-1">Tente ajustar sua busca ou crie um novo painel</p>
            </div>
          )}

          {!isLoading && filteredPanels.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPanels.map((panel) => (
                <div
                  key={panel.id}
                  className="w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-all hover:border-blue-500 dark:hover:border-blue-500 group cursor-pointer"
                  onClick={() => handleOpenPanel(panel)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleOpenPanel(panel)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Abrir painel ${panel.title}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors font-primary">
                        {panel.title}
                      </h3>
                      {panel.key && (
                        <span className="inline-block px-2 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                          {panel.key}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditPanel(panel)
                      }}
                      onKeyDown={(e) => {
                        e.stopPropagation()
                      }}
                      className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors opacity-0 group-hover:opacity-100"
                      aria-label="Editar painel"
                      type="button"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 font-secondary">
                    {panel.description || 'Sem descrição'}
                  </p>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-4">
                      {panel.overdueCardCount > 0 && (
                        <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {panel.overdueCardCount} atrasado{panel.overdueCardCount > 1 ? 's' : ''}
                        </span>
                      )}
                      {panel.departmentIds && panel.departmentIds.length > 0 && (
                        <span className="text-gray-500 dark:text-gray-400">
                          {getDepartmentBadges(panel.departmentIds)}
                        </span>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      panel.scope === 'DEPARTMENT' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                    }`}>
                      {panel.scope === 'DEPARTMENT' ? 'Equipe' : 'Pessoal'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>{filteredPanels.length} painel{filteredPanels.length === 1 ? '' : 'éis'} encontrado{filteredPanels.length === 1 ? '' : 's'}</span>
          </div>
        </div>
      </div>

      {/* Panel View Modal */}
      {showPanelView && selectedPanel && (
        <PanelViewModal
          panel={{
            ...selectedPanel,
            steps: selectedPanel.steps
              ? selectedPanel.steps.map(step => ({
                  ...step,
                  id: step.id || ''
                }))
              : []
          }}
          open={showPanelView}
          onClose={handleClosePanelView}
        />
      )}

      {/* Panel Edit Modal */}
      {showPanelEdit && (
        <PanelEditModal
          panel={editingPanel}
          open={showPanelEdit}
          onClose={handleClosePanelEdit}
          onSave={handleSavePanel}
        />
      )}
    </>
  )
}

