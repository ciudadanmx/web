import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import NavBar from './components/NavBar';

const App = () => {
  const { user, isAuthenticated } = useAuth0();

  return (
    <div>
      <NavBar />
      <h1>Prueba de Autenticación con Google</h1>
      <p>{isAuthenticated ? `Usuario: ${user?.name}` : 'No hay usuario'}</p>
    </div>
  );
};

export default App;
