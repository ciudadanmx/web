import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import NavBar from './components/NavBar';

const App = () => {
  const { user, isAuthenticated } = useAuth0();

  return (
    <div>
      <NavBar />
      
    </div>
  );
};

export default App;
