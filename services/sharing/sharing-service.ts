import type { DashboardFilters } from '@/types/dashboard'

const SHARE_BASE_URL = process.env.NEXT_PUBLIC_SHARE_BASE_URL || '/share'

export interface ShareLink {
  id: string
  token: string
  filters: DashboardFilters
  createdAt: Date
  expiresAt?: Date
  views: number
  maxViews?: number
}

class SharingService {
  private links: Map<string, ShareLink> = new Map()

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadLinks()
    }
  }

  private loadLinks() {
    try {
      const stored = localStorage.getItem('crm-dashboard-share-links')
      if (stored) {
        const data = JSON.parse(stored)
        Object.entries(data).forEach(([id, link]: [string, any]) => {
          this.links.set(id, {
            ...link,
            createdAt: new Date(link.createdAt),
            expiresAt: link.expiresAt ? new Date(link.expiresAt) : undefined,
          })
        })
      }
    } catch (error) {
      console.error('Failed to load share links:', error)
    }
  }

  private saveLinks() {
    if (typeof window === 'undefined') return

    try {
      const data: Record<string, any> = {}
      this.links.forEach((link, id) => {
        data[id] = link
      })
      localStorage.setItem('crm-dashboard-share-links', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save share links:', error)
    }
  }

  createShareLink(
    filters: DashboardFilters,
    expiresInDays?: number,
    maxViews?: number
  ): ShareLink {
    const token = this.generateToken()
    const id = `share-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const link: ShareLink = {
      id,
      token,
      filters,
      createdAt: new Date(),
      expiresAt: expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : undefined,
      views: 0,
      maxViews,
    }

    this.links.set(id, link)
    this.saveLinks()

    return link
  }

  getShareLink(token: string): ShareLink | null {
    const link = Array.from(this.links.values()).find((l) => l.token === token)
    
    if (!link) return null

    if (link.expiresAt && link.expiresAt < new Date()) {
      this.deleteShareLink(link.id)
      return null
    }

    if (link.maxViews && link.views >= link.maxViews) {
      return null
    }

    link.views++
    this.saveLinks()

    return link
  }

  getShareUrl(token: string): string {
    if (typeof window === 'undefined') {
      return `${SHARE_BASE_URL}/${token}`
    }
    return `${window.location.origin}${SHARE_BASE_URL}/${token}`
  }

  deleteShareLink(id: string): boolean {
    const deleted = this.links.delete(id)
    if (deleted) {
      this.saveLinks()
    }
    return deleted
  }

  getMyShareLinks(): ShareLink[] {
    return Array.from(this.links.values())
  }

  private generateToken(): string {
    return Math.random().toString(36).substr(2, 16) + Date.now().toString(36)
  }
}

export const sharingService = new SharingService()

