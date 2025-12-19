export interface DrillContext {
  level: number
  path: string[]
  filters: Record<string, any>
  viewType: 'macro' | 'micro' | 'detail'
}

class DrillService {
  private history: DrillContext[] = []
  private currentContext: DrillContext | null = null

  drillDown(
    dimension: string,
    value: any,
    additionalFilters?: Record<string, any>
  ): DrillContext {
    const newContext: DrillContext = {
      level: (this.currentContext?.level || 0) + 1,
      path: [...(this.currentContext?.path || []), `${dimension}:${value}`],
      filters: {
        ...this.currentContext?.filters,
        [dimension]: value,
        ...additionalFilters,
      },
      viewType: this.currentContext?.level === 0 ? 'micro' : 'detail',
    }

    this.history.push(this.currentContext || { level: 0, path: [], filters: {}, viewType: 'macro' })
    this.currentContext = newContext

    return newContext
  }

  drillUp(): DrillContext | null {
    if (this.history.length === 0) return null

    this.currentContext = this.history.pop() || null
    return this.currentContext
  }

  drillThrough(
    targetView: string,
    filters: Record<string, any>
  ): DrillContext {
    const newContext: DrillContext = {
      level: 0,
      path: [`through:${targetView}`],
      filters,
      viewType: 'detail',
    }

    this.history.push(this.currentContext || { level: 0, path: [], filters: {}, viewType: 'macro' })
    this.currentContext = newContext

    return newContext
  }

  getCurrentContext(): DrillContext | null {
    return this.currentContext
  }

  canDrillUp(): boolean {
    return this.history.length > 0
  }

  reset(): void {
    this.history = []
    this.currentContext = null
  }
}

export const drillService = new DrillService()

