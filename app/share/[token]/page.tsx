'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorMessage from '@/components/ui/ErrorMessage'
import DashboardHeader from '@/components/layout/DashboardHeader'
import GenerationActivation from '@/components/dashboard/GenerationActivation'
import SalesConversion from '@/components/dashboard/SalesConversion'
import ConversionRatesComponent from '@/components/dashboard/ConversionRates'
import LeadStockComponent from '@/components/dashboard/LeadStock'
import SalesByConversionTimeComponent from '@/components/dashboard/SalesByConversionTime'
import LeadQualityComponent from '@/components/dashboard/LeadQuality'
import type { DashboardData } from '@/types/dashboard'
import { sharingService } from '@/services/sharing/sharing-service'
import { dataSourceAdapter } from '@/services/data/data-source-adapter'

export default function SharePage() {
  const params = useParams()
  const token = params?.token as string
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadSharedDashboard() {
      try {
        setLoading(true)
        setError(null)

        const shareLink = sharingService.getShareLink(token)

        if (!shareLink) {
          setError('Link compartilhado inválido ou expirado')
          setLoading(false)
          return
        }

        const data = await dataSourceAdapter.getDashboardData(shareLink.filters)
        setDashboardData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load shared dashboard')
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      loadSharedDashboard()
    }
  }, [token])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ErrorMessage message={error || 'Dashboard não encontrado'} />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--theme-background)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 font-secondary">
            Você está visualizando um dashboard compartilhado. Esta é uma visualização somente leitura.
          </p>
        </div>

        <DashboardHeader />

        <div id="dashboard-export-container" className="space-y-6">
          <GenerationActivation data={dashboardData.generationActivation} />

          <SalesConversion data={dashboardData.salesConversion} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ConversionRatesComponent data={dashboardData.conversionRates} />
            <LeadStockComponent data={dashboardData.leadStock} />
          </div>

          <SalesByConversionTimeComponent data={dashboardData.salesByConversionTime} />

          <LeadQualityComponent data={dashboardData.leadQuality} />
        </div>
      </div>
    </div>
  )
}

