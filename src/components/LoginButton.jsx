import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { useAuth } from './AuthContext'; // Asegúrate de importar tu contexto de autenticación

const API_URL = process.env.REACT_APP_STRAPI_URL; // Usamos la URL de Strapi del .env

const LoginButton = () => {
  const { loginWithRedirect, user: auth0User } = useAuth0();
  const { setUser } = useAuth();

  useEffect(() => {
    const checkUserInStrapi = async () => {
      if (auth0User) {
        try {
          // Comprobamos si el usuario existe en Strapi usando el email de Auth0
          const response = await axios.get(`${API_URL}/users?email=${auth0User.email}`, {
            headers: {
              Authorization: `Bearer ${auth0User.sub}`, // Enviar token JWT de Auth0 si es necesario
            },
          });

          if (response.data.length === 0) {
            // Si el usuario no existe en Strapi, lo creamos
            const newUser = {
              username: auth0User.nickname,
              email: auth0User.email,
              // Agrega otros campos según sea necesario
            };

            await axios.post(`${API_URL}/users`, newUser, {
              headers: {
                Authorization: `Bearer ${auth0User.sub}`, // Enviar token JWT
              },
            });
          }

          // Establecemos el usuario en nuestro contexto de autenticación
          setUser(auth0User);
        } catch (error) {
          console.error('Error al comprobar o crear el usuario en Strapi:', error);
        }
      }
    };

    checkUserInStrapi();
  }, [auth0User, setUser]);

  return (
    <button onClick={() => loginWithRedirect()}>
      Iniciar sesión
    </button>
  );
};

export default LoginButton;
