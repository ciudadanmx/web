import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Para manejar la carga de autenticación

  // Función para iniciar sesión
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_STRAPI_URL}/auth/local`, {
        identifier: email,
        password,
      });

      // Si la respuesta es exitosa, actualiza el usuario
      setUser(response.data.user);
      localStorage.setItem('authToken', response.data.jwt); // Guarda el token en el localStorage
    } catch (error) {
      console.error('Error logging in:', error);
      throw error; // Lanza el error para manejarlo en el componente
    } finally {
      setLoading(false);
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    setUser(null);
    localStorage.removeItem('authToken'); // Elimina el token del localStorage
  };

  // Verifica si hay un usuario autenticado al inicio
  const checkUserAuthenticated = () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Si hay un token, se puede decodificar y actualizar el usuario
      setUser({ email: 'user@example.com' }); // Aquí deberías obtener los datos del usuario real desde tu API
    }
    setLoading(false); // Finaliza el estado de carga
  };

  // Llama a la función de verificación al montar el componente
  React.useEffect(() => {
    checkUserAuthenticated();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
