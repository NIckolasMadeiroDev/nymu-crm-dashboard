import { useMemo } from 'react'

export interface SunburstData {
  name: string
  value: number
  children?: SunburstData[]
  level?: number
}

export const useSunburstData = (
  data: SunburstData[],
  nameKey: string,
  valueKey: string
): SunburstData[] => {
  return useMemo(() => {
    const flattenData = (items: SunburstData[], level = 0): SunburstData[] => {
      const result: SunburstData[] = []
      items.forEach((item) => {
        result.push({
          name: (item as Record<string, any>)[nameKey],
          value: (item as Record<string, any>)[valueKey],
          level,
        })
        if (item.children) {
          result.push(...flattenData(item.children, level + 1))
        }
      })
      return result
    }
    return flattenData(data)
  }, [data, nameKey, valueKey])
}

