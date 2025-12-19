import { formatCurrency } from '@/utils/format-currency'
import { format } from 'date-fns'
import type { CrmDeal } from '@/types/crm'

interface DealsTableProps {
  readonly deals: CrmDeal[]
}

export default function DealsTable({ deals }: DealsTableProps) {
  const displayedDeals = deals.slice(0, 10)

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-secondary">
              Deal
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-secondary">
              Value
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-secondary">
              Updated
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {displayedDeals.map((deal) => (
            <tr key={deal.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm font-normal text-gray-900 font-secondary">
                  {deal.title}
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm text-gray-900 font-primary">
                  {formatCurrency(deal.value)}
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm text-gray-500 font-secondary">
                  {format(new Date(deal.updatedAt), 'dd/MM/yyyy')}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {deals.length === 0 && (
        <div className="text-center py-8 text-gray-500 font-secondary">
          No deals available
        </div>
      )}
    </div>
  )
}

