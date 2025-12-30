'use client'

import { useState, useEffect } from 'react'
import { Users } from 'lucide-react'
import { helenaServiceFactory } from '@/services/helena/helena-service-factory'
import type { HelenaDepartment } from '@/services/helena/helena-departments-service'
import DepartmentMembersModal from './DepartmentMembersModal'

interface DepartmentsManagerModalProps {
  readonly open: boolean
  readonly onClose: () => void
}

export default function DepartmentsManagerModal({ open, onClose }: DepartmentsManagerModalProps) {
  const [departments, setDepartments] = useState<HelenaDepartment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<HelenaDepartment | null>(null)
  const [showMembersModal, setShowMembersModal] = useState(false)

  useEffect(() => {
    if (open) {
      fetchDepartments()
    }
  }, [open])

  const fetchDepartments = async () => {
    setIsLoading(true)
    try {
      const departmentsService = helenaServiceFactory.getDepartmentsService()
      // Primeiro lista todas as equipes
      const data = await departmentsService.listDepartments()
      
      // Para cada equipe, buscar detalhes completos usando getDepartmentById
      const departmentsWithDetails = await Promise.all(
        data.map(async (dept) => {
          try {
            const details = await departmentsService.getDepartmentById(dept.id, 'All')
            return details
          } catch (error) {
            console.warn(`Erro ao buscar detalhes da equipe ${dept.id}:`, error)
            // Retornar equipe sem detalhes se falhar
            return dept
          }
        })
      )
      
      setDepartments(departmentsWithDetails)
    } catch (error) {
      console.error('Erro ao carregar equipes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleViewMembers = (dept: HelenaDepartment) => {
    setSelectedDepartment(dept)
    setShowMembersModal(true)
  }

  const handleMembersModalClose = () => {
    setShowMembersModal(false)
    setSelectedDepartment(null)
    fetchDepartments() // Recarregar para atualizar contagem de membros
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

        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-primary">
              Equipes
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-secondary">
              Gerencie suas equipes e distribuição de atendimentos
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

        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar equipes..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-secondary"
              />
              <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          )}

          {!isLoading && filteredDepartments.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-lg font-medium">Nenhuma equipe encontrada</p>
              <p className="text-sm mt-1">Tente ajustar sua busca</p>
            </div>
          )}

          {!isLoading && filteredDepartments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDepartments.map((dept) => (
                <div
                  key={dept.id}
                  className="w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-all hover:border-blue-500 dark:hover:border-blue-500"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1 font-primary">
                        {dept.name}
                      </h3>
                    </div>
                    {dept.isDefault && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                        Padrão
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 font-secondary">
                    {dept.agents && dept.agents.length > 0 && (
                      <button
                        onClick={() => handleViewMembers(dept)}
                        className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors w-full text-left"
                      >
                        <Users className="w-4 h-4" />
                        <span>{dept.agents.length} {dept.agents.length === 1 ? 'membro' : 'membros'}</span>
                        <span className="ml-auto text-xs text-gray-400">Ver/Editar</span>
                      </button>
                    )}
                    {(!dept.agents || dept.agents.length === 0) && (
                      <button
                        onClick={() => handleViewMembers(dept)}
                        className="flex items-center gap-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors w-full text-left"
                      >
                        <Users className="w-4 h-4" />
                        <span>Sem membros</span>
                        <span className="ml-auto text-xs">Adicionar</span>
                      </button>
                    )}
                    {dept.channels && dept.channels.length > 0 && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>{dept.channels.length} {dept.channels.length === 1 ? 'canal' : 'canais'}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        dept.restrictionType === 'NONE'
                          ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          : dept.restrictionType === 'DEPARTMENT_RESTRICTION'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      }`}>
                        {dept.restrictionType === 'NONE' 
                          ? 'Sem restrição' 
                          : dept.restrictionType === 'DEPARTMENT_RESTRICTION'
                          ? 'Restrição por equipe'
                          : 'Restrição por usuário'}
                      </span>
                    </div>
                    {dept.distribuitionEnabled && (
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs">Distribuição habilitada</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>{filteredDepartments.length} equipe{filteredDepartments.length === 1 ? '' : 's'} encontrada{filteredDepartments.length === 1 ? '' : 's'}</span>
          </div>
        </div>
      </div>

      {showMembersModal && selectedDepartment && (
        <DepartmentMembersModal
          open={showMembersModal}
          department={selectedDepartment}
          onClose={handleMembersModalClose}
          onUpdate={handleMembersModalClose}
        />
      )}
    </>
  )
}

