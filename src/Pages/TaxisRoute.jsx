import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useRoles } from '../Contexts/RolesContext';
import Conductor from '../components/Taxis/Conductor';
import Pasajero from '../components/Taxis/Pasajero';

const TaxisRoute = () => {
  const location = useLocation();
  const { roles, fetchRoles } = useRoles();

  console.log('🔹 Roles recibidos en TaxisRoute:', roles);

  // Obtenemos un array de roles, ya sea que "roles" sea un array o un objeto con la propiedad "roles"
  const actualRoles = Array.isArray(roles) ? roles : roles?.roles || [];

  const [activeTab, setActiveTab] = useState('');
  const [showTabs, setShowTabs] = useState(false);
  const [HideTabs, setHideTabs] = useState(false);  // Estado para ocultar las tabs

  console.log('🔹 Estado inicial de activeTab:', activeTab);

  const routeRepeat = location.state?.routeRepeat || 0;

  useEffect(() => {
    console.log('🌀 Ejecutando useEffect en TaxisRoute...');
    
    if (actualRoles.length === 1 && actualRoles[0] === 'invitado') {
      console.log('🔄 Cargando roles desde el servidor...');
      fetchRoles();
    }

    if (routeRepeat % 2 === 0) {
      setShowTabs(false);
    } else {
      setShowTabs(true);
    }

    console.log('🟠 Roles actuales:', actualRoles);
    console.log('🟠 ¿Roles incluye "conductor"?', actualRoles.includes("conductor"));

    if (actualRoles.length > 0) {
      const newActiveTab = actualRoles.includes("conductor") ? 'conductor' : 'pasajero';
      console.log('✅ Nuevo valor de activeTab:', newActiveTab);
      setActiveTab(newActiveTab);
    }
  }, [routeRepeat, roles]);

  return (
    <div style={{ width: '90%', height: '100vh', overflow: 'hidden', padding: '20px' }}>
      {/* Mostrar tabs solo si showTabs es true y HideTabs es false */}
      {actualRoles.includes("conductor") && showTabs && !HideTabs && (
        <div style={{ display: 'flex', borderBottom: '2px solid #ccc', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('pasajero')}
            style={{ flex: 1, padding: '10px', cursor: 'pointer', background: activeTab === 'pasajero' ? '#fff200' : '#fff' }}
          >
            Pasajero
          </button>
          <button
            onClick={() => setActiveTab('conductor')}
            style={{ flex: 1, padding: '10px', cursor: 'pointer', background: activeTab === 'conductor' ? '#fff200' : '#fff' }}
          >
            Conductor
          </button>
        </div>
      )}

      {actualRoles.includes("conductor") ? (
        activeTab === 'pasajero' ? <Pasajero /> : <Conductor
         setHideTabs={setHideTabs}
         setShowTabs={setShowTabs}
         showTabs={showTabs}
         hideTabs={HideTabs}
         setActiveTab={setActiveTab}
         />
      ) : (
        <Pasajero />
      )}
    </div>
  );
};

export default TaxisRoute;
