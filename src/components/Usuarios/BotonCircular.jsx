import React from 'react';
import { ReactComponent as BotonMovil } from '../../assets/boton-robot.svg';
import { AiOutlineRobot } from 'react-icons/ai';

function BotonCircular({ clase, mediaQ }) {

  if (mediaQ) {
    return (
      <button className={clase}>
        <BotonMovil className="asistente-ia"/>
      </button>
    );
  }

  else {
    return (
      <button className={clase } >
        <BotonMovil className="asistente-ia asistente-ia-svg"/>
      </button>
    );
  }
}

export default BotonCircular;








