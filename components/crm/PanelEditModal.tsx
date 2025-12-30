'use client'

import { useState, useEffect } from 'react'
import { helenaServiceFactory } from '@/services/helena/helena-service-factory'

interface PanelStep {
  id?: string
  title: string
  position: number
  isInitial: boolean
  isFinal: boolean
  archived?: boolean
  color?: string
  cardCount?: number
}

interface Panel {
  id: string
  title: string
  key: string
  description: string
  scope: string
  departmentIds: string[] | null
  steps?: PanelStep[]
}

interface Department {
  id: string
  name: string
}

interface PanelEditModalProps {
  readonly panel?: Panel | null
  readonly open: boolean
  readonly onClose: () => void
  readonly onSave: () => void
}

const STEP_COLORS = [
  { value: '#3B82F6', label: 'Azul' },
  { value: '#10B981', label: 'Verde' },
  { value: '#F59E0B', label: 'Laranja' },
  { value: '#EF4444', label: 'Vermelho' },
  { value: '#8B5CF6', label: 'Roxo' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#06B6D4', label: 'Ciano' },
  { value: '#6B7280', label: 'Cinza' },
]

export default function PanelEditModal({ panel, open, onClose, onSave }: PanelEditModalProps) {
  const [title, setTitle] = useState('')
  const [key, setKey] = useState('')
  const [description, setDescription] = useState('')
  const [scope, setScope] = useState<'PERSONAL' | 'DEPARTMENT'>('DEPARTMENT')
  const [departmentIds, setDepartmentIds] = useState<string[]>([])
  const [isRestrictedService, setIsRestrictedService] = useState(false)
  const [viewType, setViewType] = useState<'ALL' | 'INDIVIDUAL'>('ALL')
  const [steps, setSteps] = useState<PanelStep[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingDepts, setIsLoadingDepts] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditMode = !!panel

  useEffect(() => {
    if (open) {
      loadDepartments()

      if (panel) {
        setTitle(panel.title)
        setKey(panel.key || '')
        setDescription(panel.description || '')
        setScope(panel.scope as 'PERSONAL' | 'DEPARTMENT')
        setDepartmentIds(panel.departmentIds || [])

        const activeSteps = (panel.steps || [])
          .filter(s => !s.archived)
          .sort((a, b) => a.position - b.position)
        setSteps(activeSteps)
      } else {
        setTitle('')
        setKey('')
        setDescription('')
        setScope('DEPARTMENT')
        setDepartmentIds([])
        setViewType('ALL')
        setIsRestrictedService(false)
        setSteps([])
      }
      setError(null)
    }
  }, [open, panel])

  const loadDepartments = async () => {
    setIsLoadingDepts(true)
    try {
      const deptService = helenaServiceFactory.getDepartmentsService()
      const data = await deptService.listDepartments()
      setDepartments(data.map(d => ({ id: d.id, name: d.name })))
    } catch (err) {
      console.error('Erro ao carregar departamentos:', err)
    } finally {
      setIsLoadingDepts(false)
    }
  }

  const getStepType = (step: PanelStep): string => {
    if (step.isInitial) return 'Fase inicial'
    if (step.isFinal) return 'Fase final'
    return 'Fase intermediária'
  }

  const handleAddStep = () => {
    const newStep: PanelStep = {
      title: '',
      position: steps.length + 1,
      isInitial: steps.length === 0,
      isFinal: false,
      color: STEP_COLORS[steps.length % STEP_COLORS.length].value,
      cardCount: 0
    }
    setSteps([...steps, newStep])
  }

  const handleUpdateStep = (index: number, field: keyof PanelStep, value: any) => {
    const updatedSteps = [...steps]

    if (field === 'isInitial' && value === true) {

      updatedSteps.forEach((s, i) => {
        if (i !== index) s.isInitial = false
      })
    }

    updatedSteps[index] = { ...updatedSteps[index], [field]: value }
    setSteps(updatedSteps)
  }

  const handleRemoveStep = async (index: number) => {
    const step = steps[index]

    if (isEditMode && step.id && panel) {

      try {
        const panelsService = helenaServiceFactory.getPanelsService()
        await panelsService.deletePanelStep(panel.id, step.id)
      } catch (err) {
        console.error('Erro ao remover fase:', err)
        setError('Erro ao remover fase. Tente novamente.')
        return
      }
    }


    const updatedSteps = steps.filter((_, i) => i !== index)

    updatedSteps.forEach((s, i) => {
      s.position = i + 1
    })
    setSteps(updatedSteps)
  }

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === steps.length - 1)
    ) {
      return
    }

    const updatedSteps = [...steps]
    const targetIndex = direction === 'up' ? index - 1 : index + 1


    ;[updatedSteps[index], updatedSteps[targetIndex]] = [updatedSteps[targetIndex], updatedSteps[index]]


    updatedSteps.forEach((s, i) => {
      s.position = i + 1
    })

    setSteps(updatedSteps)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)


    if (!title.trim()) {
      setError('O título é obrigatório')
      return
    }

    if (scope === 'DEPARTMENT' && departmentIds.length === 0) {
      setError('Selecione pelo menos um departamento')
      return
    }


    for (let i = 0; i < steps.length; i++) {
      if (!steps[i].title.trim()) {
        setError(`A fase ${i + 1} precisa ter um título`)
        return
      }
    }

    setIsLoading(true)

    try {
      const panelsService = helenaServiceFactory.getPanelsService()

      const payload = {
        title,
        key: key || undefined,
        description,
        scope,
        departmentIds: scope === 'DEPARTMENT' ? departmentIds : undefined,
        isRestrictedService,
        viewType
      }

      if (isEditMode && panel) {

        await panelsService.updatePanel(panel.id, payload)


        for (const step of steps) {
          const stepPayload = {
            title: step.title,
            position: step.position,
            isInitial: step.isInitial,
            isFinal: step.isFinal,
            color: step.color
          }

          if (step.id) {

            await panelsService.updatePanelStep(panel.id, step.id, stepPayload)
          } else {

            await panelsService.createPanelStep(panel.id, stepPayload)
          }
        }
      } else {

        const newPanel = await panelsService.createPanel(payload)


        for (const step of steps) {
          await panelsService.createPanelStep(newPanel.id, {
            title: step.title,
            position: step.position,
            isInitial: step.isInitial,
            isFinal: step.isFinal,
            color: step.color
          })
        }
      }

      onSave()
      onClose()
    } catch (err) {
      console.error('Erro ao salvar painel:', err)
      setError('Erro ao salvar painel. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!open) return null

  return (
    <>
      <button
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] cursor-default"
        onClick={onClose}
        aria-label="Fechar modal"
        type="button"
      ></button>

      <div className="fixed inset-4 md:inset-8 lg:inset-12 bg-white dark:bg-gray-900 rounded-xl shadow-2xl z-[70] flex flex-col overflow-hidden max-w-6xl mx-auto">

        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-primary">
            {isEditMode ? 'Editar Painel' : 'Novo Painel'}
          </h2>
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


        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-secondary">
                  Título *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-secondary"
                  placeholder="Ex: Abertura de Empresa"
                />
              </div>

              <div>
                <label htmlFor="key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-secondary">
                  Chave
                </label>
                <input
                  type="text"
                  id="key"
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-secondary font-mono uppercase"
                  placeholder="Ex: 0ADE"
                />
              </div>
            </div>


            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-secondary">
                Descrição
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={500}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-secondary resize-none"
                placeholder="Descreva o objetivo deste painel..."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {description.length}/500
              </p>
            </div>


            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-secondary">
                Quem pode administrar
              </label>
              {isLoadingDepts ? (
                <div className="text-sm text-gray-500">Carregando departamentos...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {departments.map((dept) => (
                    <label key={dept.id} className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <input
                        type="checkbox"
                        checked={departmentIds.includes(dept.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDepartmentIds([...departmentIds, dept.id])
                            setScope('DEPARTMENT')
                          } else {
                            const newDepts = departmentIds.filter(id => id !== dept.id)
                            setDepartmentIds(newDepts)
                            if (newDepts.length === 0) {
                              setScope('PERSONAL')
                            }
                          }
                        }}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{dept.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>


            <div>
              <label className="flex items-center justify-between p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div>
                  <span className="block text-sm font-medium text-gray-900 dark:text-white">Atendimento Restrito</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">Apenas membros autorizados podem visualizar</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRestrictedService(!isRestrictedService)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isRestrictedService ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isRestrictedService ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
            </div>


            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-secondary">
                Quem pode acessar *
              </label>
              <div className="space-y-2">
                <label className="flex items-start p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <input
                    type="radio"
                    name="viewType"
                    value="ALL"
                    checked={viewType === 'ALL'}
                    onChange={(e) => setViewType(e.target.value as 'ALL')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 mt-0.5"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-medium text-gray-900 dark:text-white">Todos</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">Usuários e supervisores visualizam todos os cards.</span>
                  </div>
                </label>
                <label className="flex items-start p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <input
                    type="radio"
                    name="viewType"
                    value="INDIVIDUAL"
                    checked={viewType === 'INDIVIDUAL'}
                    onChange={(e) => setViewType(e.target.value as 'INDIVIDUAL')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 mt-0.5"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-medium text-gray-900 dark:text-white">Individual</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">Usuário visualiza apenas os cards em que é responsável e o supervisor da equipe visualiza todos os cards.</span>
                  </div>
                </label>
              </div>
            </div>


            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-secondary">
                  Fases
                </label>
                <button
                  type="button"
                  onClick={handleAddStep}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Adicionar Fase
                </button>
              </div>

              {steps.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma fase adicionada</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Clique em &quot;Adicionar Fase&quot; para começar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <div key={step.id || index} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-start gap-3">

                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveStep(index, 'up')}
                            disabled={index === 0}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Mover para cima"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveStep(index, 'down')}
                            disabled={index === steps.length - 1}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Mover para baixo"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>


                        <div className="flex-1 space-y-3">

                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[30px]">
                              {index})
                            </span>
                            <input
                              type="text"
                              value={step.title}
                              onChange={(e) => handleUpdateStep(index, 'title', e.target.value)}
                              placeholder="Nome da fase"
                              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            />
                            <select
                              value={step.color || STEP_COLORS[0].value}
                              onChange={(e) => handleUpdateStep(index, 'color', e.target.value)}
                              className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900"
                              style={{ backgroundColor: step.color }}
                            >
                              {STEP_COLORS.map(color => (
                                <option key={color.value} value={color.value} style={{ backgroundColor: color.value, color: 'white' }}>
                                  {color.label}
                                </option>
                              ))}
                            </select>
                          </div>


                          <div className="flex items-center gap-2 text-xs">
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={step.isInitial}
                                onChange={(e) => handleUpdateStep(index, 'isInitial', e.target.checked)}
                                className="w-3 h-3 text-blue-600 focus:ring-blue-500 rounded"
                              />
                              <span className="text-gray-700 dark:text-gray-300">Fase inicial</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={step.isFinal}
                                onChange={(e) => handleUpdateStep(index, 'isFinal', e.target.checked)}
                                className="w-3 h-3 text-blue-600 focus:ring-blue-500 rounded"
                              />
                              <span className="text-gray-700 dark:text-gray-300">Fase final</span>
                            </label>
                            {!step.isInitial && !step.isFinal && (
                              <span className="text-gray-500 dark:text-gray-400">Fase intermediária</span>
                            )}
                            {step.cardCount !== undefined && step.cardCount > 0 && (
                              <span className="ml-auto text-gray-500 dark:text-gray-400">
                                {step.cardCount} card{step.cardCount > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>


                        <button
                          type="button"
                          onClick={() => handleRemoveStep(index)}
                          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded transition-colors"
                          aria-label="Remover fase"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </form>


        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors font-secondary disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading || !title.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-secondary"
            >
              {isLoading ? 'Salvando...' : isEditMode ? 'Salvar Alterações' : 'Criar Painel'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
