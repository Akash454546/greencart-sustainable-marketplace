import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createOrder } from '../api/index.js';
import useCartStore from '../store/cartStore.js';

export function useCart() {
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const total = items.reduce((sum, i) => sum + i.product.price * i.qty, 0);

  return {
    cart: items,
    total,
    clearCart,
  };
}

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
