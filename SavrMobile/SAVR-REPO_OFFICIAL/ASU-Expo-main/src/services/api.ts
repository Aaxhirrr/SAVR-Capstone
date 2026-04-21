import axios from 'axios';

export const API_BASE_URL = 'http://31.97.140.85:8001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export default api;
