'use client'

import { useState, useEffect } from 'react'
import { X, Edit2, Trash2, User, Shield, UserCheck } from 'lucide-react'
import { helenaServiceFactory } from '@/services/helena/helena-service-factory'
import type { HelenaDepartment, HelenaDepartmentAgent } from '@/services/helena/helena-departments-service'
import type { HelenaUser } from '@/types/helena'

interface DepartmentMembersModalProps {
  readonly open: boolean
  readonly department: HelenaDepartment | null
  readonly onClose: () => void
  readonly onUpdate: () => void
}

export default function DepartmentMembersModal({
  open,
  department,
  onClose,
  onUpdate,
}: DepartmentMembersModalProps) {
  const [members, setMembers] = useState<HelenaDepartmentAgent[]>([])
  const [users, setUsers] = useState<HelenaUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editingMember, setEditingMember] = useState<HelenaDepartmentAgent | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (open && department) {
      // Resetar estados ao abrir
      setMembers([])
      setEditingMember(null)
      fetchMembers()
      fetchUsers()
    }
  }, [open, department?.id]) // Usar department.id para recarregar quando mudar a equipe

  const fetchMembers = async () => {
    if (!department) return
    
    setIsLoading(true)
    try {
      const departmentsService = helenaServiceFactory.getDepartmentsService()
      // Usar 'All' para obter todos os detalhes (agents, channels, etc)
      const deptWithDetails = await departmentsService.getDepartmentById(department.id, 'All')
      setMembers(deptWithDetails.agents || [])
    } catch (error) {
      console.error('Erro ao carregar membros:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const usersService = helenaServiceFactory.getUsersService()
      const allUsers = await usersService.getAllUsers()
      // Verificar se retorna array ou objeto com data
      setUsers(Array.isArray(allUsers) ? allUsers : [])
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      // Continuar mesmo se falhar ao carregar usuários
      setUsers([])
    }
  }

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    return user?.name || userId
  }

  const getUserEmail = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    return user?.email || ''
  }

  const handleEdit = (member: HelenaDepartmentAgent) => {
    setEditingMember({ ...member })
  }

  const handleSaveEdit = async () => {
    if (!department || !editingMember) return

    setIsSaving(true)
    try {
      const departmentsService = helenaServiceFactory.getDepartmentsService()
      await departmentsService.updateDepartmentAgents(department.id, {
        action: 'Upsert',
        items: [{
          userId: editingMember.userId,
          isAgent: editingMember.isAgent,
          isSupervisor: editingMember.isSupervisor,
        }],
      })
      setEditingMember(null)
      // Recarregar dados completos da equipe usando getDepartmentById
      await fetchMembers()
      onUpdate()
    } catch (error) {
      console.error('Erro ao atualizar membro:', error)
      alert('Erro ao atualizar membro. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (member: HelenaDepartmentAgent) => {
    if (!department) return

    if (!confirm(`Tem certeza que deseja remover ${getUserName(member.userId)} da equipe?`)) {
      return
    }

    setIsDeleting(member.userId)
    try {
      const departmentsService = helenaServiceFactory.getDepartmentsService()
      await departmentsService.updateDepartmentAgents(department.id, {
        action: 'Remove',
        items: [{
          userId: member.userId,
          isAgent: false, // Para Remove, pode não ser necessário, mas incluindo para compatibilidade
          isSupervisor: false,
        }],
      })
      // Recarregar dados completos da equipe usando getDepartmentById
      await fetchMembers()
      onUpdate()
    } catch (error) {
      console.error('Erro ao remover membro:', error)
      alert('Erro ao remover membro. Tente novamente.')
    } finally {
      setIsDeleting(null)
    }
  }

  const handleCancelEdit = () => {
    setEditingMember(null)
  }

  if (!open || !department) return null

  return (
    <>
      <button
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] cursor-default"
        onClick={onClose}
        aria-label="Fechar modal"
        type="button"
      ></button>

      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl z-[70] flex flex-col overflow-hidden max-h-[85vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-primary">
              Membros da Equipe: {department.name}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-secondary">
              Gerencie os membros e suas permissões
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <User className="w-16 h-16 mb-4" />
              <p className="text-lg font-medium">Nenhum membro encontrado</p>
              <p className="text-sm mt-1">Esta equipe não possui membros</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => {
                const isEditing = editingMember?.userId === member.userId
                const isDeletingMember = isDeleting === member.userId

                return (
                  <div
                    key={member.userId}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                  >
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {getUserName(member.userId)}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {getUserEmail(member.userId)}
                          </p>
                        </div>
                        <div className="space-y-3">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editingMember.isAgent}
                              onChange={(e) =>
                                setEditingMember({
                                  ...editingMember,
                                  isAgent: e.target.checked,
                                })
                              }
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div className="flex items-center gap-2">
                              <UserCheck className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                Agente
                              </span>
                            </div>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editingMember.isSupervisor}
                              onChange={(e) =>
                                setEditingMember({
                                  ...editingMember,
                                  isSupervisor: e.target.checked,
                                })
                              }
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                Supervisor
                              </span>
                            </div>
                          </label>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={handleSaveEdit}
                            disabled={isSaving}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSaving ? 'Salvando...' : 'Salvar'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {getUserName(member.userId)}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {getUserEmail(member.userId)}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              {member.isAgent && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                                  <UserCheck className="w-3 h-3" />
                                  Agente
                                </span>
                              )}
                              {member.isSupervisor && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full">
                                  <Shield className="w-3 h-3" />
                                  Supervisor
                                </span>
                              )}
                              {!member.isAgent && !member.isSupervisor && (
                                <span className="text-xs text-gray-400">Sem permissões</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(member)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            aria-label="Editar membro"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(member)}
                            disabled={isDeletingMember}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                            aria-label="Remover membro"
                          >
                            {isDeletingMember ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>
              {members.length} {members.length === 1 ? 'membro' : 'membros'}
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

