import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../axios'

export interface Category {
  id: string
  name: string
  slug: string
  parentId: string | null
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await apiClient.get<Category[]>('/categories')
      return data
    },
  })
}
