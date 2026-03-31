import { create } from 'zustand'
import { getSettings, getCompany } from '@/api/settings.api'

export const useAppStore = create((set, get) => ({
  // formatting
  currency: 'BOB',
  currencySymbol: 'Bs.',
  priceDecimals: 0,
  quantityDecimals: 2,
  // company
  company: null, // { name, logo_url, ... }
  loaded: false,

  loadConfig: async () => {
    try {
      const [settingsRes, companyRes] = await Promise.all([
        getSettings(),
        getCompany(),
      ])

      const groups = settingsRes.data.data ?? {}
      const flat = {}
      Object.values(groups).forEach((group) =>
        group.forEach((s) => { flat[s.key] = s.value })
      )

      set({
        currency:         flat.currency         ?? 'BOB',
        currencySymbol:   flat.currency_symbol  ?? 'Bs.',
        priceDecimals:    parseInt(flat.price_decimals    || '0') || 0,
        quantityDecimals: parseInt(flat.quantity_decimals || '2') || 2,
        company:          companyRes.data.data  ?? null,
        loaded:           true,
      })
    } catch {
      set({ loaded: true })
    }
  },

  // Call after saving settings or company to refresh
  reload: () => {
    set({ loaded: false })
    get().loadConfig()
  },
}))
