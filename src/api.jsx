import axios from 'axios';

const api = axios.create({
  baseURL: `${process.env.REACT_APP_STRAPI_URL}/api/`, // Usar la variable de entorno para la URL de Strapi
});

export default api;

