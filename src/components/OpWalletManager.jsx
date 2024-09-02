import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';

const OpWalletManager = () => {
  const { user, isAuthenticated } = useAuth0();
  const [walletExists, setWalletExists] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  useEffect(() => {
    const fetchWallet = async () => {
      if (isAuthenticated && user.email) {
        try {
          console.log('Fetching wallet for user:', user.email);
          const response = await axios.get(`${process.env.REACT_APP_STRAPI_URL}/api/world-coin-wallets`, {
            params: {
              filters: {
                user_id: user.email,
              },
            },
          });

          console.log('Fetch response:', response.data);

          if (response.data.data.length > 0) {
            setWalletExists(true);
            setWalletAddress(response.data.data[0].attributes.WalletIdx);
          } else {
            setWalletExists(false);
          }
        } catch (error) {
          console.error('Error fetching wallet:', error);
        }
      }
    };

    fetchWallet();
  }, [isAuthenticated, user]);

  const createWallet = async () => {
    const newWalletAddress = `0x${Math.random().toString(36).substring(2, 42)}`; // Genera una dirección ficticia de cartera

    try {
      console.log('Creating wallet with address:', newWalletAddress);
      const response = await axios.post(`${process.env.REACT_APP_STRAPI_URL}/api/world-coin-wallets`, {
        data: {
          user_id: user.email,
          WalletIdx: newWalletAddress,
        },
      });

      console.log('Create wallet response:', response.data);

      if (response.status === 200) {
        setWalletExists(true);
        setWalletAddress(newWalletAddress);
        alert('Cartera creada exitosamente!');
        console.log('aca agrega una peticion indpendietiente a strapi para meter la cartera a la base de datos')
      } else {
        alert('Hubo un error al crear la cartera. Por favor, inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error creating wallet:', error);
      alert('Hubo un error al crear la cartera. Por favor, inténtalo de nuevo.');
    }
  };

  return (
    <div>
      <h2>Gestión de Cartera</h2>
      {walletExists ? (
        <div>
          <p>Cartera existente: {walletAddress}</p>
          <button onClick={() => alert('Aquí puedes agregar funcionalidad para administrar la cartera.')}>
            Administrar Cartera
          </button>
        </div>
      ) : (
        <div>
          <p>No tienes una cartera asociada.</p>
          <button onClick={createWallet}>Crear Cartera</button>
        </div>
      )}
    </div>
  );
};

export default OpWalletManager;
