import client from './client'
export const getTickets = (params) => client.get('/tickets', { params })
export const getTicket = (id) => client.get(`/tickets/${id}`)
export const createTicket = (data) => client.post('/tickets', data)
export const updateTicket = (id, data) => client.put(`/tickets/${id}`, data)
export const updateTicketStatus = (id, data) => client.patch(`/tickets/${id}/status`, data)
export const deleteTicket = (id) => client.delete(`/tickets/${id}`)
export const uploadPhoto = (ticketId, formData) => client.post(`/tickets/${ticketId}/photos`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const deletePhoto = (ticketId, photoId) => client.delete(`/tickets/${ticketId}/photos/${photoId}`)

export const restoreTicket = (id) => client.post(`/tickets/${id}/restore`)
