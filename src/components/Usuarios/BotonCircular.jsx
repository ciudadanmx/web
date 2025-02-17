import React from 'react';
import { ReactComponent as BotonMovil } from '../../assets/boton-robot.svg';
import { AiOutlineRobot } from 'react-icons/ai';

function BotonCircular({ clase, mediaQ }) {

  if (mediaQ) {
    return (
      <button className={clase}>
        <BotonMovil />
      </button>
    );
  }

  else {
    return (
      <button className={clase}>
        <AiOutlineRobot />
      </button>
    );
  }
}

export default BotonCircular;








