import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { ethers } from 'ethers';

const alchemyApiUrl = `https://opt-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`;
const worldcoinContractAddress = '0x163f8C2467924be0ae7B5347228CABF260318753';
const worldcoinAbi = [
  // ABI para el método balanceOf de ERC-20
  "function balanceOf(address owner) view returns (uint256)"
];

const OpWalletManager = () => {
  const { user, isAuthenticated } = useAuth0();
  const [walletExists, setWalletExists] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [worldcoinBalance, setWorldcoinBalance] = useState(0);

  const fetchWorldcoinBalance = async (address) => {
    try {
      const provider = new ethers.JsonRpcProvider(alchemyApiUrl);
      const contract = new ethers.Contract(worldcoinContractAddress, worldcoinAbi, provider);
      const balance = await contract.balanceOf(address);
      setWorldcoinBalance(ethers.formatUnits(balance, 18));
    } catch (error) {
      console.error('Error fetching Worldcoin balance:', error);
    }
  };

  useEffect(() => {
    const fetchWallet = async () => {
      if (isAuthenticated && user.email) {
        try {
          const response = await axios.post(`${process.env.REACT_APP_STRAPI_URL}/api/world-coin-wallets`, {
            filters: {
              user_id: user.email,
            },
          });

          if (response.data.data.length > 0) {
            setWalletExists(true);
            const walletAddr = response.data.data[0].attributes.CarteraIdx;
            setWalletAddress(walletAddr);
            await fetchWorldcoinBalance(walletAddr);
          } else {
            setWalletExists(false);
          }
        } catch (error) {
          console.error('Error fetching wallet:', error);
        }
      }
    };

    if (isAuthenticated && user) {
      fetchWallet();
    }
  }, [isAuthenticated, user]);

  const createWallet = async () => {
    try {
      const wallet = ethers.Wallet.createRandom(); // Crea una nueva cartera real
      const newWalletAddress = wallet.address;

      const response = await axios.post(`${process.env.REACT_APP_STRAPI_URL}/api/world-coin-wallets`, {
        data: {
          user_id: user.email,
          CarteraIdx: newWalletAddress,
        },
      });

      if (response.status === 200) {
        setWalletExists(true);
        setWalletAddress(newWalletAddress);
        await fetchWorldcoinBalance(newWalletAddress);
        alert('Cartera creada exitosamente!');
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
          <p>Saldo de Worldcoins: {worldcoinBalance} WLD</p>
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
