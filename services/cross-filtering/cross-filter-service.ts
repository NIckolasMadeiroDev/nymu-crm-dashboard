type FilterCallback = (filters: Record<string, any>) => void

class CrossFilterService {
  private subscribers: Map<string, Set<FilterCallback>> = new Map()
  private currentFilters: Record<string, any> = {}

  subscribe(chartId: string, callback: FilterCallback): () => void {
    if (!this.subscribers.has(chartId)) {
      this.subscribers.set(chartId, new Set())
    }

    this.subscribers.get(chartId)!.add(callback)

    return () => {
      this.subscribers.get(chartId)?.delete(callback)
      if (this.subscribers.get(chartId)?.size === 0) {
        this.subscribers.delete(chartId)
      }
    }
  }

  applyFilter(sourceChartId: string, filters: Record<string, any>): void {
    this.currentFilters = { ...this.currentFilters, ...filters }

    this.subscribers.forEach((callbacks, chartId) => {
      if (chartId !== sourceChartId) {
        callbacks.forEach((callback) => {
          callback(this.currentFilters)
        })
      }
    })
  }

  clearFilters(): void {
    this.currentFilters = {}
    this.subscribers.forEach((callbacks) => {
      callbacks.forEach((callback) => {
        callback({})
      })
    })
  }

  getCurrentFilters(): Record<string, any> {
    return { ...this.currentFilters }
  }
}

export const crossFilterService = new CrossFilterService()

