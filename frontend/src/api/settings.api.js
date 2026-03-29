import client from './client'

export const getSettings = () => client.get('/settings')
export const updateSettings = (settings) => client.patch('/settings', { settings })

export const getCompany = () => client.get('/company')
export const updateCompany = (formData) => client.post('/company', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
