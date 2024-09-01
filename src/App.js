import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import LoginButton from './components/LoginButton';
import LogoutButton from './components/LogoutButton';
import Profile from './components/Profile';

console.log('app');

const App = () => {
  const { user, isAuthenticated } = useAuth0();

  return (
    <Router>
      <div>
        <nav>
          <LoginButton />
          <LogoutButton />
        </nav>
        <Routes>
          <Route
            path="/"
            element={
              <div>
                <h1>Bienvenido a la aplicación</h1>
                {isAuthenticated && (
                  <p>Estás logueado como: {user.email}</p>
                )}
              </div>
            }
          />
          <Route path="/perfil" element={<Profile />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
