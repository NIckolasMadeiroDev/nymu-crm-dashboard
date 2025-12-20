'use client'

import { useState, useEffect } from 'react'
import { Trash2, Edit2, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  themeService,
  type Theme,
  type CustomTheme,
} from '@/services/theme/theme-service'

export default function ThemeSelector() {
  const [currentTheme, setCurrentTheme] = useState<Theme>('light')
  const [currentCustomThemeId, setCurrentCustomThemeId] = useState<string | null>(null)
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [editingTheme, setEditingTheme] = useState<CustomTheme | null>(null)

  useEffect(() => {
    const theme = themeService.getTheme()
    setCurrentTheme(theme)
    setCustomThemes(themeService.getCustomThemes())

    if (theme === 'custom') {
      const customId = themeService.getCurrentCustomThemeId()
      setCurrentCustomThemeId(customId)
    }
  }, [])

  const handleThemeChange = (value: string) => {
    if (value === 'nymu-light' || value === 'nymu-dark' || value === 'light' || value === 'dark') {
      themeService.setTheme(value as Theme)
      setCurrentTheme(value as Theme)
      setCurrentCustomThemeId(null)
    } else if (value.startsWith('custom-')) {
      const themeId = value.replace('custom-', '')
      themeService.applyCustomTheme(themeId)
      setCurrentTheme('custom')
      setCurrentCustomThemeId(themeId)
    }
  }

  const handleCreateTheme = () => {
    setEditingTheme(null)
    setShowDialog(true)
  }

  const handleEditTheme = (theme: CustomTheme) => {
    setEditingTheme(theme)
    setShowDialog(true)
  }

  const handleDeleteTheme = (themeId: string) => {
    const theme = customThemes.find((t) => t.id === themeId)
    const themeName = theme?.name || 'este tema'

    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p className="font-medium">Confirmar exclusão</p>
          <p className="text-sm">
            Tem certeza que deseja excluir o tema &quot;{themeName}&quot;? Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                toast.dismiss(t.id)
                themeService.deleteCustomTheme(themeId)
                const updatedThemes = themeService.getCustomThemes()
                setCustomThemes(updatedThemes)

                if (currentCustomThemeId === themeId) {
                  themeService.setTheme('nymu-light')
                  setCurrentTheme('nymu-light')
                  setCurrentCustomThemeId(null)
                }
                toast.success('Tema excluído com sucesso!')
              }}
              className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
            >
              Excluir
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Cancelar
            </button>
          </div>
        </div>
      ),
      {
        duration: 10000,
        icon: '🗑️',
      }
    )
  }

  const handleSaveTheme = (name: string, colors: CustomTheme['colors']) => {
    if (!name || name.trim() === '') {
      toast.error('Por favor, informe um nome para o tema.')
      return
    }

    if (editingTheme) {
      themeService.updateCustomTheme(editingTheme.id, { name: name.trim(), colors })
      toast.success('Tema atualizado com sucesso!')
    } else {
      themeService.createCustomTheme(name.trim(), colors)
      toast.success('Tema criado com sucesso!')
    }

    const updatedThemes = themeService.getCustomThemes()
    setCustomThemes(updatedThemes)
    setShowDialog(false)
    setEditingTheme(null)
  }

  const getSelectValue = () => {
    if (currentTheme === 'custom' && currentCustomThemeId) {
      return `custom-${currentCustomThemeId}`
    }
    return currentTheme
  }

  return (
    <div className="w-full flex items-center gap-1 sm:gap-2">
      <div className="relative flex-1 min-w-0">
      <select
          value={getSelectValue()}
          onChange={(e) => handleThemeChange(e.target.value)}
          className="w-full px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-[10px] sm:text-xs md:text-sm font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        aria-label="Selecionar tema"
      >
          <option value="nymu-light">🌞 Nymu Claro</option>
          <option value="nymu-dark">🌙 Nymu Escuro</option>
          <option value="light">🌞 Claro Alternativo</option>
          <option value="dark">🌙 Escuro Alternativo</option>
          {customThemes
            .filter((theme) => theme.name && theme.name.trim() !== '')
            .map((theme) => (
              <option key={`custom-${theme.id}`} value={`custom-${theme.id}`}>
                🎨 {theme.name}
          </option>
        ))}
      </select>
      </div>

      <div className="flex items-center gap-1">
        {currentTheme === 'custom' && currentCustomThemeId && (
          <>
            <button
              onClick={() => {
                const theme = customThemes.find((t) => t.id === currentCustomThemeId)
                if (theme) handleEditTheme(theme)
              }}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20"
              aria-label="Editar tema atual"
              title="Editar tema atual"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => handleDeleteTheme(currentCustomThemeId)}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20"
              aria-label="Excluir tema atual"
              title="Excluir tema atual"
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
      <button
          onClick={handleCreateTheme}
          className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-secondary flex items-center gap-1"
          aria-label="Criar novo tema"
      >
          <Plus size={16} />
          Novo Tema
      </button>
      </div>

      {showDialog && (
        <ThemeDialog
          theme={editingTheme}
          onClose={() => {
            setShowDialog(false)
            setEditingTheme(null)
          }}
          onSave={handleSaveTheme}
        />
      )}
    </div>
  )
}

interface ThemeDialogProps {
  readonly theme: CustomTheme | null
  readonly onClose: () => void
  readonly onSave: (name: string, colors: CustomTheme['colors']) => void
}

function ThemeDialog({ theme, onClose, onSave }: Readonly<ThemeDialogProps>) {
  const [name, setName] = useState(theme?.name || '')
  const [colors, setColors] = useState<CustomTheme['colors']>(
    theme?.colors || {
    primary: '#3b82f6',
    secondary: '#10b981',
    background: '#ffffff',
    foreground: '#171717',
    accent: '#8b5cf6',
    }
  )

  const colorLabels: Record<keyof CustomTheme['colors'], string> = {
    primary: 'Primária',
    secondary: 'Secundária',
    background: 'Fundo',
    foreground: 'Texto',
    accent: 'Destaque',
  }

  const handleSave = () => {
    if (!name || name.trim() === '') {
      toast.error('Por favor, informe um nome para o tema.')
      return
    }
    onSave(name.trim(), colors)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold font-primary text-gray-900 dark:text-white">
            {theme ? 'Editar Tema' : 'Criar Novo Tema'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="theme-name-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome do Tema
            </label>
          <input
            id="theme-name-input"
            type="text"
              placeholder="Ex: Meu Tema Personalizado"
            value={name}
            onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave()
                } else if (e.key === 'Escape') {
                  onClose()
                }
              }}
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Cores
            </span>
            <div className="space-y-3">
          {Object.entries(colors).map(([key, value]) => (
                <div key={key} className="flex items-center gap-3">
                  <label className="w-24 text-sm font-secondary text-gray-700 dark:text-gray-300 capitalize">
                    {colorLabels[key as keyof CustomTheme['colors']]}:
                  </label>
                  <div className="flex-1 flex items-center gap-2">
              <input
                type="color"
                value={value}
                      onChange={(e) =>
                        setColors({ ...colors, [key]: e.target.value })
                      }
                      className="h-10 w-20 rounded border border-gray-300 cursor-pointer dark:border-gray-600"
                    />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) =>
                        setColors({ ...colors, [key]: e.target.value })
                      }
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs font-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="#000000"
              />
                  </div>
            </div>
          ))}
        </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mt-4">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              💡 Dica: Use cores que tenham bom contraste para melhor legibilidade.
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-secondary"
          >
            {theme ? 'Salvar Alterações' : 'Criar Tema'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-secondary dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
