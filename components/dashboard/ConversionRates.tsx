import type { ConversionRates } from '@/types/dashboard'

interface ConversionRatesProps {
  readonly data: ConversionRates
  readonly useVisualDesign?: boolean
}

export default function ConversionRatesComponent({ data, useVisualDesign = true }: Readonly<ConversionRatesProps>) {
  const rates = [
    {
      label: 'Criado → Grupo',
      current: data.createdToGroup.current,
      target: data.createdToGroup.target,
    },
    {
      label: 'Grupo → Meet',
      current: data.groupToMeet.current,
      target: data.groupToMeet.target,
    },
    {
      label: 'Meet → Venda',
      current: data.meetToSale.current,
      target: data.meetToSale.target,
    },
  ]

  return (
    <div className="flex flex-col justify-center space-y-2.5 sm:space-y-3 md:space-y-3.5 py-2 sm:py-3">
        {rates.map((rate) => {
          const progressPercentage = Math.min((rate.current / rate.target) * 100, 100)
          const isAboveTarget = rate.current >= rate.target

          return (
            <div key={rate.label} className="flex flex-col">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <span className="text-sm sm:text-base font-medium text-gray-700 font-secondary">
                  {rate.label}
                </span>
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <span className="text-base sm:text-lg md:text-xl font-bold text-gray-900 font-primary">
                    {rate.current.toFixed(1)}%
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500 font-secondary">
                    Meta: {rate.target}%
                  </span>
                </div>
              </div>
              {useVisualDesign ? (
                <div className="relative w-full h-2.5 sm:h-3 md:h-3.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isAboveTarget
                        ? 'bg-gradient-to-r from-green-500 to-green-600'
                        : 'bg-gradient-to-r from-blue-500 to-blue-600'
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              ) : (
              <progress
                className="w-full h-2.5 sm:h-3 md:h-3.5 rounded-full bg-gray-200 overflow-hidden"
                value={rate.current}
                max={rate.target}
                aria-label={`${rate.label}: ${rate.current.toFixed(1)}% de ${rate.target}%`}
                style={{
                  accentColor: isAboveTarget ? '#16a34a' : '#2563eb',
                }}
              >
                {progressPercentage}%
              </progress>
              )}
            </div>
          )
        })}
    </div>
  )
}

