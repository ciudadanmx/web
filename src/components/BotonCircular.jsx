import React from 'react';
import { AiOutlineRobot } from 'react-icons/ai';

function BotonCircular({ clase }) {
  return (
    <button className={clase}>
      <AiOutlineRobot />
    </button>
  );
}

export default BotonCircular;

