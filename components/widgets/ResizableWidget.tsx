'use client'

import { useState, useRef, useEffect } from 'react'

interface ResizableWidgetProps {
  readonly children: React.ReactNode
  readonly minHeight?: number
  readonly onResize?: (width: number, height: number) => void
  readonly className?: string
  readonly autoAdjustHeight?: boolean
  readonly fixedHeight?: number
}

export default function ResizableWidget({
  children,
  minHeight = 100,
  onResize,
  className = '',
  autoAdjustHeight = false,
  fixedHeight,
}: Readonly<ResizableWidgetProps>) {
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [isAdjustingHeight, setIsAdjustingHeight] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const lastHeightRef = useRef<number>(0)
  const isUpdatingRef = useRef<boolean>(false)

  useEffect(() => {
    if (fixedHeight) {
      setSize({ width: 0, height: fixedHeight })
      return
    }
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setSize({ width: rect.width, height: rect.height })
    }
  }, [fixedHeight])

  const prevAutoAdjustHeightRef = useRef(autoAdjustHeight)

  useEffect(() => {
    if (fixedHeight) {
      setSize(prev => {
        const width = prev.width || (containerRef.current?.getBoundingClientRect().width || 0)
        onResize?.(width, fixedHeight)
        return { ...prev, height: fixedHeight }
      })
      return
    }
    if (!contentRef.current) return

    const updateHeight = () => {
      // Previne loops infinitos
      if (isUpdatingRef.current) return
      
      if (contentRef.current && containerRef.current) {
        isUpdatingRef.current = true
        
        // Força layout recalculation mesmo se elemento não estiver visível
        const forceLayout1 = contentRef.current.offsetHeight
        const forceLayout2 = contentRef.current.scrollTop
        void forceLayout1
        void forceLayout2
        
        // Calcula altura do conteúdo real (sem incluir o próprio container)
        // Usa clientHeight para evitar incluir scrollbars
        const contentHeight = contentRef.current.scrollHeight > 0 
          ? contentRef.current.scrollHeight 
          : contentRef.current.offsetHeight
        const currentWidth = containerRef.current.getBoundingClientRect().width || containerRef.current.offsetWidth
        
        // Padding responsivo: menor no mobile
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
        const padding = isMobile 
          ? (autoAdjustHeight ? 8 : 12)
          : (autoAdjustHeight ? 15 : 20)
        
        // Altura máxima responsiva: menor no mobile para evitar crescimento excessivo
        const maxHeight = typeof window !== 'undefined' 
          ? (isMobile ? Math.min(window.innerHeight * 0.5, 400) : window.innerHeight * 0.8)
          : 600
        
        // Calcula altura alvo: mínimo entre minHeight e maxHeight, com padding
        const targetHeight = Math.min(
          maxHeight,
          Math.max(minHeight, contentHeight + padding)
        )
        
        // Só atualiza se a altura mudou significativamente (evita loops)
        if (Math.abs(targetHeight - lastHeightRef.current) > 2) {
          lastHeightRef.current = targetHeight
          
          // Agenda atualização de forma assíncrona para evitar flushSync durante renderização
          queueMicrotask(() => {
            setSize(prev => {
              const updatedSize = { ...prev, height: targetHeight }
              onResize?.(prev.width || currentWidth, targetHeight)
              return updatedSize
            })
          })
        }
        
        isUpdatingRef.current = false
      }
    }

    // Quando autoAdjustHeight muda, força ajuste instantâneo de uma só vez
    const autoAdjustChanged = prevAutoAdjustHeightRef.current !== autoAdjustHeight
    if (autoAdjustChanged) {
      // Força atualização imediata quando análises são ativadas ou desativadas
      setIsAdjustingHeight(true)
      
      if (!autoAdjustHeight) {
        // Quando desativando, força recálculo imediato
        if (contentRef.current && containerRef.current) {
          // Força layout recalculation mesmo se elemento não estiver visível
          const forceLayout1 = contentRef.current.offsetHeight
          const forceLayout2 = contentRef.current.scrollTop
          void forceLayout1
          void forceLayout2
          
          // Força recálculo baseado no conteúdo real (gráfico + elementos acima)
          const contentHeight = contentRef.current.scrollHeight > 0
            ? contentRef.current.scrollHeight
            : contentRef.current.offsetHeight
          const currentWidth = containerRef.current.getBoundingClientRect().width || containerRef.current.offsetWidth
          const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
          const maxHeight = typeof window !== 'undefined' 
            ? (isMobile ? Math.min(window.innerHeight * 0.5, 400) : window.innerHeight * 0.8)
            : 600
          // Padding responsivo para gráfico sem análises
          const padding = isMobile ? 12 : 20
          const targetHeight = Math.min(
            maxHeight,
            Math.max(minHeight, contentHeight + padding)
          )
          
          // Agenda atualização de forma assíncrona para evitar flushSync durante renderização
          queueMicrotask(() => {
            setSize(prev => {
              const updatedSize = { ...prev, height: targetHeight }
              onResize?.(prev.width || currentWidth, targetHeight)
              return updatedSize
            })
          })
        }
        setIsAdjustingHeight(false)
      } else {
        // Quando ativando, ajusta imediatamente
        updateHeight()
        setIsAdjustingHeight(false)
      }
    }
    
    prevAutoAdjustHeightRef.current = autoAdjustHeight

    // Observa mudanças no conteúdo, mas com debounce para evitar loops
    let resizeTimeout: NodeJS.Timeout | null = null
    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimeout) clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        updateHeight()
      }, 50) // Debounce de 50ms para evitar atualizações excessivas
    })

    resizeObserver.observe(contentRef.current)

    // Força atualização inicial
    updateHeight()
    
    // Atualização adicional após renderização inicial
    const immediateUpdate = setTimeout(() => {
      updateHeight()
    }, 100)

    return () => {
      resizeObserver.disconnect()
      if (resizeTimeout) clearTimeout(resizeTimeout)
      clearTimeout(immediateUpdate)
      isUpdatingRef.current = false
    }
  }, [autoAdjustHeight, minHeight, onResize, children, fixedHeight])


  const height = fixedHeight || (size.height > 0 ? size.height : undefined)

  return (
    <div
      ref={containerRef}
      className={`relative no-height-transition ${className}`}
      style={{ 
        width: '100%', 
        height: height ? `${height}px` : '100%',
        minHeight: height ? `${height}px` : '100%',
        maxHeight: height ? `${height}px` : undefined,
        transition: 'none !important',
        WebkitTransition: 'none !important',
        MozTransition: 'none !important',
        OTransition: 'none !important',
        msTransition: 'none !important',
        transitionProperty: 'none !important',
        transitionDuration: '0s !important',
        transitionDelay: '0s !important',
        animation: 'none !important',
        WebkitAnimation: 'none !important',
        overflow: 'hidden'
      }}
    >
      <div 
        ref={contentRef} 
        style={{ 
          minHeight: '100%',
          transition: 'none !important',
          transitionProperty: 'none !important',
          transitionDuration: '0s !important',
          animation: 'none !important',
        }}
    >
      {children}
      </div>
    </div>
  )
}

