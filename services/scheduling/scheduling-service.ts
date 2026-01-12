import type { ScheduledReport } from '@/services/export/export-service'

const STORAGE_KEY = 'crm-dashboard-scheduled-reports'

class SchedulingService {
  private reports: ScheduledReport[] = []

  constructor() {
    this.loadReports()
  }

  private loadReports() {
    if (globalThis.window === undefined) return

    try {
      const stored = globalThis.window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        this.reports = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load scheduled reports:', error)
      this.reports = []
    }
  }

  private saveReports() {
    if (globalThis.window === undefined) return

    try {
      globalThis.window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.reports))
    } catch (error) {
      console.error('Failed to save scheduled reports:', error)
    }
  }

  createReport(report: Omit<ScheduledReport, 'id'>): ScheduledReport {
    const newReport: ScheduledReport = {
      ...report,
      id: `report-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    }

    this.reports.push(newReport)
    this.saveReports()
    this.scheduleReport(newReport)

    return newReport
  }

  updateReport(id: string, updates: Partial<ScheduledReport>): ScheduledReport | null {
    const index = this.reports.findIndex((r) => r.id === id)
    if (index === -1) return null

    this.reports[index] = { ...this.reports[index], ...updates }
    this.saveReports()

    if (updates.enabled !== undefined || updates.schedule || updates.time) {
      this.scheduleReport(this.reports[index])
    }

    return this.reports[index]
  }

  deleteReport(id: string): boolean {
    const index = this.reports.findIndex((r) => r.id === id)
    if (index === -1) return false

    this.reports.splice(index, 1)
    this.saveReports()
    return true
  }

  getReports(): ScheduledReport[] {
    return [...this.reports]
  }

  getReport(id: string): ScheduledReport | null {
    return this.reports.find((r) => r.id === id) || null
  }

  private scheduleReport(report: ScheduledReport) {
    if (!report.enabled) return

    const nextRun = this.calculateNextRun(report.schedule, report.time)
    const now = new Date()
    const delay = nextRun.getTime() - now.getTime()

    if (delay > 0) {
      setTimeout(() => {
        this.executeReport(report)
        this.scheduleReport(report)
      }, delay)
    }
  }

  private calculateNextRun(
    schedule: 'daily' | 'weekly' | 'monthly',
    time: string
  ): Date {
    const [hours, minutes] = time.split(':').map(Number)
    const now = new Date()
    const nextRun = new Date()

    nextRun.setHours(hours, minutes || 0, 0, 0)

    switch (schedule) {
      case 'daily':
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1)
        }
        break
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + (7 - nextRun.getDay()))
        break
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1)
        nextRun.setDate(1)
        break
    }

    return nextRun
  }

  private async executeReport(report: ScheduledReport) {
    try {
      // Fetch dashboard data from API
      const response = await fetch('/api/dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters: report.filters,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.statusText}`)
      }

      const data = await response.json()

      const { exportService } = await import('@/services/export/export-service')
      const result = await exportService.exportDashboard(data, {
        format: report.format,
        includeCharts: true,
        includeTables: true,
        includeKPIs: true,
        title: report.name,
      })

      const blob = typeof result === 'string' 
        ? new Blob([result], { type: 'text/plain' })
        : result

      this.sendReport(report, blob)
    } catch (error) {
      console.error('Failed to execute scheduled report:', error)
    }
  }

  private async sendReport(report: ScheduledReport, blob: Blob) {
    report.recipients.forEach((recipient) => {
      console.log(`Sending report ${report.name} to ${recipient}`)
    })
  }
}

export const schedulingService = new SchedulingService()

