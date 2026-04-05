import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createOrder } from '../api/index.js';
import useCartStore from '../store/cartStore.js';

export function useCheckout() {
  const queryClient = useQueryClient();
  const clearCart = useCartStore((s) => s.clearCart);
  const closeCart = useCartStore((s) => s.closeCart);

  return useMutation({
    mutationFn: (items) => createOrder(items),
    onSuccess: () => {
      clearCart();
      closeCart();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
