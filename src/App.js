// src/App.js
import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

const App = () => {
  const { user, isAuthenticated } = useAuth0();

  return (
    <div>
      {/* Aquí no incluimos NavBar para evitar duplicarla */}
      <Outlet />
    </div>
  );
};

export default App;
