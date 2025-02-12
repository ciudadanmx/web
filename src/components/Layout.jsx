// src/components/Layout.js
import React from 'react';
import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';

const Layout = () => {

    console.log('/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*');
      useEffect(()=>{
        console.log('*/*/*/*/*/*/*/*//*/********///// ');
      }, []);
    

  return (
    <>
    <div>
      <NavBar />
      <h1> Outlet !!! </h1>
      <Outlet />
      </div>
    </>
  );
};

export default Layout;
