import { OrderItemResponse } from '@/types/database';

export async function fetchOrderTotal(orderId: string): Promise<number> {
  const res = await fetch(`/api/order-items?orderId=${orderId}`);
  const data = await res.json();
  if (!data.success) return 0;
  const items: OrderItemResponse[] = data.data || [];
  let total = 0;
  items.forEach(item => {
    total += item.quantity * item.price;
  });
  return Number(total.toFixed(2));
}
