import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:1337/api/', // Reemplaza con la URL de tu servidor Strapi
});

export default api;
