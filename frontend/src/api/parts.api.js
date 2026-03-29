import client from './client'
export const getParts = (ticketId) => client.get(`/tickets/${ticketId}/parts`)
export const createPart = (ticketId, data) => client.post(`/tickets/${ticketId}/parts`, data)
export const updatePart = (ticketId, partId, data) => client.put(`/tickets/${ticketId}/parts/${partId}`, data)
export const deletePart = (ticketId, partId) => client.delete(`/tickets/${ticketId}/parts/${partId}`)
