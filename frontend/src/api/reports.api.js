import client from './client'
export const getSummary = () => client.get('/reports/summary')
export const getByStatus = () => client.get('/reports/by-status')
export const getBySupportType = () => client.get('/reports/by-support-type')
export const getCosts = () => client.get('/reports/costs')
export const getTechnicianSummary = () => client.get('/reports/technician-summary')
export const getFinancial = (params) => client.get('/reports/financial', { params })
