import client from './client'
export const getActivityLogs = (params) => client.get('/activity-logs', { params })
