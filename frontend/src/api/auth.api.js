import client from './client'
export const login = (credentials) => client.post('/auth/login', credentials)
export const logout = () => client.post('/auth/logout')
export const me = () => client.get('/auth/me')
