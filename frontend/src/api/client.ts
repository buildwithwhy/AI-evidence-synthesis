import axios from 'axios'
import { supabase } from './supabase'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
})

client.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession()
  if (data.session?.access_token) {
    config.headers.Authorization = `Bearer ${data.session.access_token}`
  }
  return config
})

export default client
