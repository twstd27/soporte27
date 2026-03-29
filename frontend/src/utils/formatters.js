import { useAppStore } from '@/store/appStore'

export const formatCurrency = (amount) => {
  const { currencySymbol, priceDecimals } = useAppStore.getState()
  const decimals = Number.isFinite(priceDecimals) ? priceDecimals : 0
  const num = Number.isFinite(amount) ? amount : (parseFloat(amount) || 0)
  const formatted = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
  return `${currencySymbol ?? '$'}\u00a0${formatted}`
}

export const formatQuantity = (value) => {
  const { quantityDecimals } = useAppStore.getState()
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: quantityDecimals ?? 2,
    maximumFractionDigits: quantityDecimals ?? 2,
  }).format(value ?? 0)
}

export const formatDate = (date) => {
  if (!date) return '—'
  // Date-only strings (YYYY-MM-DD) must be parsed as local time, not UTC
  const d = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00`) : new Date(date)
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}
