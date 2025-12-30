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

      if (isUpdatingRef.current) return

      if (contentRef.current && containerRef.current) {
        isUpdatingRef.current = true

        const forceLayout1 = contentRef.current.offsetHeight
        const forceLayout2 = contentRef.current.scrollTop
        void forceLayout1
        void forceLayout2

        const contentHeight = contentRef.current.scrollHeight > 0
          ? contentRef.current.scrollHeight
          : contentRef.current.offsetHeight
        const currentWidth = containerRef.current.getBoundingClientRect().width || containerRef.current.offsetWidth

        const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
        const padding = isMobile
          ? (autoAdjustHeight ? 8 : 12)
          : (autoAdjustHeight ? 15 : 20)

        const maxHeight = typeof window !== 'undefined'
          ? (isMobile ? Math.min(window.innerHeight * 0.5, 400) : window.innerHeight * 0.8)
          : 600

        const targetHeight = Math.min(
          maxHeight,
          Math.max(minHeight, contentHeight + padding)
        )

        if (Math.abs(targetHeight - lastHeightRef.current) > 2) {
          lastHeightRef.current = targetHeight

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

    const autoAdjustChanged = prevAutoAdjustHeightRef.current !== autoAdjustHeight
    if (autoAdjustChanged) {

      setIsAdjustingHeight(true)

      if (!autoAdjustHeight) {

        if (contentRef.current && containerRef.current) {

          const forceLayout1 = contentRef.current.offsetHeight
          const forceLayout2 = contentRef.current.scrollTop
          void forceLayout1
          void forceLayout2

          const contentHeight = contentRef.current.scrollHeight > 0
            ? contentRef.current.scrollHeight
            : contentRef.current.offsetHeight
          const currentWidth = containerRef.current.getBoundingClientRect().width || containerRef.current.offsetWidth
          const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
          const maxHeight = typeof window !== 'undefined'
            ? (isMobile ? Math.min(window.innerHeight * 0.5, 400) : window.innerHeight * 0.8)
            : 600

          const padding = isMobile ? 12 : 20
          const targetHeight = Math.min(
            maxHeight,
            Math.max(minHeight, contentHeight + padding)
          )

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

        updateHeight()
        setIsAdjustingHeight(false)
      }
    }

    prevAutoAdjustHeightRef.current = autoAdjustHeight

    let resizeTimeout: NodeJS.Timeout | null = null
    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimeout) clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        updateHeight()
      }, 50) // Debounce de 50ms para evitar atualizações excessivas
    })

    resizeObserver.observe(contentRef.current)

    updateHeight()

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

