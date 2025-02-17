// src/components/Layout.js
import React from 'react';
import { Outlet } from 'react-router-dom';
import NavBar from './NavBar/NavBar';
import App from '../App.js';

const Layout = () => {
  return (
    <>
      <NavBar />
      <App />
    </>
  );
};

export default Layout;
