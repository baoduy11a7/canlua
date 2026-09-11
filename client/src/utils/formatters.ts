export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) return '0 đ';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatKg = (kg: number | null | undefined, decimals = 1): string => {
  if (kg === null || kg === undefined || isNaN(kg)) return '0';
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(kg);
};

export const formatDate = (dateStr: string | Date | undefined): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatDateTime = (dateStr: string | Date | undefined): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getStatusBadge = (status: string) => {
  switch (status) {
    case 'open':
      return {
        label: 'Đang cân',
        bg: 'bg-amber-100 dark:bg-amber-950/60',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-300 dark:border-amber-800',
      };
    case 'closed':
      return {
        label: 'Đã chốt',
        bg: 'bg-blue-100 dark:bg-blue-950/60',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-300 dark:border-blue-800',
      };
    case 'paid':
      return {
        label: 'Đã thanh toán',
        bg: 'bg-emerald-100 dark:bg-emerald-950/60',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-300 dark:border-emerald-800',
      };
    default:
      return {
        label: status,
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-300 dark:border-slate-700',
      };
  }
};
