import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

const App = () => {
  
  return (
    <div>
      {/* Aquí no incluimos NavBar para evitar duplicarla */}
      <Outlet />
    </div>
  );
};

export default App;
