import { useQuery } from '@tanstack/react-query';
import { fetchProducts, fetchProduct } from '../api/index.js';

export function useProducts(params) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => fetchProducts(params),
    keepPreviousData: true,
  });
}

export function useProduct(id) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id),
    enabled: !!id,
  });
}
