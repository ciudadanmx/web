import React from 'react';

import ciudadanCompleto from '../assets/ciudadanCompleto.jpg';
import ciudadanMobile from '../assets/ciudadanMobile.jpg';
//
const HomeRoute = () => {
  return (
    <div className="home">
      <img 
        src={ciudadanCompleto} 
        srcSet={`${ciudadanMobile} 480w, ${ciudadanCompleto} 800w`} 
        sizes="(max-width: 480px) 100vw, 100vw" 
        alt="Ciudadan" 
      />
      <h1>Bienvenido a Ciudadan</h1>
      <p>Explora nuestras secciones principales y servicios.</p>
      {/* Aquí puedes agregar más contenido */}
    </div>
  );
};

export default HomeRoute;
