import { formatCurrency, formatNumber } from '@/utils/format-currency'
import type { CrmMetrics } from '@/types/crm'

interface MetricsCardsProps {
  readonly metrics: CrmMetrics
}

export default function MetricsCards({ metrics }: MetricsCardsProps) {
  const cards = [
    {
      title: 'Total Deals',
      value: formatNumber(metrics.totalDeals),
      description: 'Active deals in pipeline',
    },
    {
      title: 'Total Value',
      value: formatCurrency(metrics.totalValue),
      description: 'Sum of all deal values',
    },
    {
      title: 'Average Deal Value',
      value: formatCurrency(metrics.averageDealValue),
      description: 'Mean value per deal',
    },
    {
      title: 'Conversion Rate',
      value: `${metrics.conversionRate.toFixed(1)}%`,
      description: 'Overall conversion percentage',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-gray-100"
        >
          <h3 className="text-xs sm:text-sm font-medium text-gray-600 font-secondary mb-1 sm:mb-1.5">
            {card.title}
          </h3>
          <p className="text-lg sm:text-xl font-bold text-gray-900 font-primary">
            {card.value}
          </p>
          <p className="text-xs text-gray-500 font-secondary mt-1 sm:mt-1.5">
            {card.description}
          </p>
        </div>
      ))}
    </div>
  )
}

