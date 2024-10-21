// src/components/Profile.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../Contexts/AuthContext';
import axios from 'axios';

const Profile = () => {
  const { user, logout, loading } = useAuth(); // Obtiene el usuario y la función de logout
  const [walletAddress, setWalletAddress] = useState(null);
  const [walletExists, setWalletExists] = useState(false);
  const [error, setError] = useState(null); // Para manejar errores

  useEffect(() => {
    const fetchWalletData = async () => {
      if (user) {
        try {
          const response = await axios.get(`${process.env.REACT_APP_STRAPI_URL}/api/world-coin-wallets`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}`
            }
          });

          if (response.data && response.data.length > 0) {
            setWalletExists(true);
            setWalletAddress(response.data[0].CarteraIdx);
          } else {
            setWalletExists(false);
          }
        } catch (err) {
          console.error('Error fetching wallet data:', err);
          setError('Hubo un error al obtener los datos de la cartera.'); // Guarda el mensaje de error
        }
      }
    };

    fetchWalletData();
  }, [user]);

  if (loading) return <div>Cargando...</div>; // Muestra un mensaje de carga

  if (!user) return <div>Por favor, inicia sesión para ver este contenido.</div>;

  return (
    <div>
      <h2>Perfil</h2>
      <p>Email: {user.email}</p>
      {error && <p style={{ color: 'red' }}>{error}</p>} {/* Muestra el mensaje de error si existe */}
      {walletExists ? (
        <p>Dirección de la Cartera: {walletAddress}</p>
      ) : (
        <p>No se encontró ninguna cartera. Por favor, crea una cartera.</p>
      )}
      <button onClick={logout}>Cerrar sesión</button> {/* Botón para cerrar sesión */}
    </div>
  );
};

export default Profile;
