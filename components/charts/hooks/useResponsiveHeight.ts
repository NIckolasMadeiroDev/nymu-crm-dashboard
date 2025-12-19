'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Hook que retorna altura responsiva para gráficos baseada no tamanho do container
 * Mede o container .widget-content e limita a altura ao espaço disponível
 * @param defaultHeight - Altura padrão (fallback caso não consiga medir o container)
 * @returns Altura ajustada para ocupar o espaço disponível do container, limitada ao tamanho máximo
 */
export function useResponsiveHeight(defaultHeight: number = 300): number {
  const [height, setHeight] = useState(defaultHeight)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const containerRef = useRef<HTMLElement | null>(null)
  const lastHeightRef = useRef<number>(defaultHeight)

  const findWidgetContent = useCallback((): HTMLElement | null => {
    if (containerRef.current) {
      return containerRef.current
    }

    if (globalThis.window === undefined) {
      return null
    }

    const allWidgetContents = document.querySelectorAll('.widget-content')
    
    for (const element of Array.from(allWidgetContents)) {
      const el = element as HTMLElement
      const rect = el.getBoundingClientRect()
      
      if (rect.height > 50 && rect.width > 0) {
        containerRef.current = el
        return el
      }
    }

    return null
  }, [])

  const calculateChartHeight = useCallback((widgetContent: HTMLElement, chartContainer: HTMLElement): number => {
    const widgetRect = widgetContent.getBoundingClientRect()
    const widgetHeight = widgetRect.height || widgetContent.offsetHeight || widgetContent.clientHeight
    
    if (!widgetHeight || widgetHeight <= 0 || !Number.isFinite(widgetHeight)) {
      return defaultHeight
    }

    const chartContainerStyle = globalThis.window?.getComputedStyle(chartContainer)
    if (!chartContainerStyle) {
      return Math.max(50, widgetHeight)
    }
    
    const chartPaddingTop = Number.parseFloat(chartContainerStyle.paddingTop) || 0
    const chartPaddingBottom = Number.parseFloat(chartContainerStyle.paddingBottom) || 0
    const chartBorderTop = Number.parseFloat(chartContainerStyle.borderTopWidth) || 0
    const chartBorderBottom = Number.parseFloat(chartContainerStyle.borderBottomWidth) || 0
    
    const actionsBar = chartContainer.querySelector('[class*="flex items-center justify-end"]') as HTMLElement
    const actionsHeight = actionsBar ? (actionsBar.getBoundingClientRect().height || 0) : 0
    
    const availableHeight = widgetHeight - chartPaddingTop - chartPaddingBottom - chartBorderTop - chartBorderBottom - actionsHeight
    return Math.max(50, availableHeight)
  }, [defaultHeight])

  const measureContainer = useCallback((): number => {
    const widgetContent = findWidgetContent()

    if (!widgetContent) {
      return defaultHeight
    }

    const widgetRect = widgetContent.getBoundingClientRect()
    const widgetHeight = widgetRect.height || widgetContent.offsetHeight || widgetContent.clientHeight
    
    if (!widgetHeight || widgetHeight <= 0 || !Number.isFinite(widgetHeight)) {
      return defaultHeight
    }

    const chartContainer = widgetContent.querySelector('[class*="rounded-lg"]') as HTMLElement
    if (chartContainer) {
      return calculateChartHeight(widgetContent, chartContainer)
    }
    
    const widgetStyle = globalThis.window?.getComputedStyle(widgetContent)
    const paddingTop = widgetStyle ? Number.parseFloat(widgetStyle.paddingTop) || 0 : 0
    const paddingBottom = widgetStyle ? Number.parseFloat(widgetStyle.paddingBottom) || 0 : 0
    
    const availableHeight = widgetHeight - paddingTop - paddingBottom
    return Math.max(50, availableHeight)
  }, [defaultHeight, findWidgetContent, calculateChartHeight])

  const updateHeight = useCallback(() => {
    const measuredHeight = measureContainer()
    
    if (Math.abs(measuredHeight - lastHeightRef.current) > 0.5) {
      lastHeightRef.current = measuredHeight
      setHeight(measuredHeight)
    }
  }, [measureContainer])

  const setupResizeObserver = useCallback((widgetContent: HTMLElement, observedElements: Set<HTMLElement>, mounted: boolean) => {
    if ('ResizeObserver' in globalThis.window) {
      resizeObserverRef.current ??= new ResizeObserver(() => {
        if (mounted) {
          requestAnimationFrame(() => {
            updateHeight()
          })
        }
      })
      
      if (!observedElements.has(widgetContent)) {
        resizeObserverRef.current.observe(widgetContent)
        observedElements.add(widgetContent)
      }
      
      const resizableWidget = widgetContent.closest('.relative') as HTMLElement
      if (resizableWidget && !observedElements.has(resizableWidget)) {
        resizeObserverRef.current.observe(resizableWidget)
        observedElements.add(resizableWidget)
      }
      
      const parentWidget = widgetContent.parentElement
      if (parentWidget && !observedElements.has(parentWidget)) {
        resizeObserverRef.current.observe(parentWidget)
        observedElements.add(parentWidget)
      }
      
      const chartContainer = widgetContent.querySelector('[class*="rounded-lg"]') as HTMLElement
      if (chartContainer && !observedElements.has(chartContainer)) {
        resizeObserverRef.current.observe(chartContainer)
        observedElements.add(chartContainer)
      }
    }
  }, [updateHeight])

  useEffect(() => {
    if (globalThis.window === undefined) return

    let intervalId: NodeJS.Timeout | null = null
    let mounted = true
    const observedElements = new Set<HTMLElement>()

    const findAndObserveContainer = () => {
      if (!mounted) return
      
      if (!containerRef.current) {
        const allWidgetContents = document.querySelectorAll('.widget-content')
        
        for (const widgetContent of Array.from(allWidgetContents)) {
          const element = widgetContent as HTMLElement
          const rect = element.getBoundingClientRect()
          
          if (rect.height > 50 && rect.width > 0) {
            containerRef.current = element
            break
          }
        }
      }

      if (containerRef.current) {
        updateHeight()
        setupResizeObserver(containerRef.current, observedElements, mounted)
        
        if (intervalId) {
          clearInterval(intervalId)
          intervalId = null
        }
      } else {
        updateHeight()
      }
    }
    
    const periodicUpdate = () => {
      if (mounted) {
        if (containerRef.current) {
          updateHeight()
        } else {
          findAndObserveContainer()
        }
      }
    }

    findAndObserveContainer()
    
    const timeoutId1 = setTimeout(findAndObserveContainer, 0)
    const timeoutId2 = setTimeout(findAndObserveContainer, 50)
    const timeoutId3 = setTimeout(findAndObserveContainer, 150)
    
    if (!containerRef.current) {
      intervalId = setInterval(findAndObserveContainer, 100)
    }
    
    const updateInterval = setInterval(periodicUpdate, 200)

    const handleResize = () => {
      if (mounted) {
        requestAnimationFrame(updateHeight)
      }
    }

    globalThis.window.addEventListener('resize', handleResize)

    return () => {
      mounted = false
      clearTimeout(timeoutId1)
      clearTimeout(timeoutId2)
      clearTimeout(timeoutId3)
      clearInterval(updateInterval)
      if (intervalId) {
        clearInterval(intervalId)
      }
      globalThis.window?.removeEventListener('resize', handleResize)
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
        resizeObserverRef.current = null
      }
      observedElements.clear()
    }
  }, [updateHeight, setupResizeObserver])

  return height
}

