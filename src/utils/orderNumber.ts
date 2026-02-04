export const generateOrderNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');

  return `MZQ${year}${month}${day}${random}`;
};

export const formatOrderNumber = (orderNumber?: string | null): string => {
  if (!orderNumber) return 'N/A';
  if (orderNumber.startsWith('MZQ')) return orderNumber;
  return `ORD-${orderNumber.slice(0, 8).toUpperCase()}`;
};
