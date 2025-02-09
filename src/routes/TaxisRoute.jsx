import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import Conductor from '../components/Taxis/Conductor';
import Pasajero from '../components/Taxis/Pasajero';

const TaxisRoute = () => {
    const [activeTab, setActiveTab] = useState('pasajero');
    const [error, setError] = useState(null);
    
   

    return (
        <div style={{ width: '90%', height: '100vh', overflow: 'hidden', padding: '20px' }}>
            {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
            <div style={{ display: 'flex', borderBottom: '2px solid #ccc', marginBottom: '20px' }}>
                <button 
                    onClick={() => setActiveTab('pasajero')} 
                    style={{ flex: 1, padding: '10px', cursor: 'pointer', background: activeTab === 'pasajero' ? '#fff200' : '#fff' }}>
                    Pasajero
                </button>
                <button 
                    onClick={() => setActiveTab('conductor')} 
                    style={{ flex: 1, padding: '10px', cursor: 'pointer', background: activeTab === 'conductor' ? '#fff200' : '#fff' }}>
                    Conductor
                </button>
            </div>

            {activeTab === 'pasajero' ? (
                <Pasajero />
            ) : (
                <Conductor />
            )}
        </div>
    );
};

export default TaxisRoute;
