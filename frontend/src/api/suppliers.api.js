import client from './client'
export const getSuppliers = (params) => client.get('/suppliers', { params })
export const createSupplier = (data) => client.post('/suppliers', data)
export const updateSupplier = (id, data) => client.put(`/suppliers/${id}`, data)
export const deleteSupplier = (id) => client.delete(`/suppliers/${id}`)
export const restoreSupplier = (id) => client.post(`/suppliers/${id}/restore`)
