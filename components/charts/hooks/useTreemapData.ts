import { useMemo } from 'react'

export interface TreemapData {
  name: string
  value: number
  children?: TreemapData[]
}

export const useTreemapData = (
  data: TreemapData[],
  nameKey: string,
  valueKey: string
): TreemapData[] => {
  return useMemo(() => {
    const formatData = (items: TreemapData[]): TreemapData[] => {
      return items.map((item) => ({
        name: (item as Record<string, any>)[nameKey] || item.name,
        value: (item as Record<string, any>)[valueKey] || item.value,
        children: item.children ? formatData(item.children) : undefined,
      }))
    }
    return formatData(data)
  }, [data, nameKey, valueKey])
}

