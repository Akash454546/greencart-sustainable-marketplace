import { useQuery } from '@tanstack/react-query';
import { fetchProducts, fetchProduct } from '../api/index.js';

export function useProducts(params) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => fetchProducts(params),
    keepPreviousData: true,
    staleTime: 2 * 60 * 1000,  // 2 minutes
    gcTime: 5 * 60 * 1000,     // 5 minutes (cache time)
  });
}

export function useProduct(id) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,  // 5 minutes
    gcTime: 10 * 60 * 1000,    // 10 minutes
  });
}
