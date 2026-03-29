import client from './client'
export const getSupportTypes = (params) => client.get('/support-types', { params })
export const createSupportType = (data) => client.post('/support-types', data)
export const updateSupportType = (id, data) => client.put(`/support-types/${id}`, data)
export const deleteSupportType = (id) => client.delete(`/support-types/${id}`)
export const restoreSupportType = (id) => client.post(`/support-types/${id}/restore`)
