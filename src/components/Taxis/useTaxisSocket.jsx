import { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';


export default function useTaxisSocket(onFoundDrivers = () => {}) {
const socketRef = useRef(null);
const [connected, setConnected] = useState(false);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [drivers, setDrivers] = useState([]);

// utilidad para stringify seguro
const safeStringify = (obj, max = 2000) => {
try {
const s = JSON.stringify(obj, null, 2);
return s.length > max ? s.slice(0, max) + '... (truncated)' : s;
} catch (e) {
return String(obj);
}
};

useEffect(() => {
const url = process.env.REACT_APP_SOCKET_URL;
if (!url) return;


try {
socketRef.current = io(url, { transports: ['websocket'] });


socketRef.current.on('connect', () => {
setConnected(true);
setError(null);
console.log('[useTaxisSocket] conectado', socketRef.current.id);
});


socketRef.current.on('disconnect', (reason) => {
setConnected(false);
console.warn('[useTaxisSocket] disconnected', reason);
});


socketRef.current.on('connect_error', (err) => {
setError(err?.message || 'connect_error');
console.warn('[useTaxisSocket] connect_error', err);
});

socketRef.current.on('drivers-found', (driversPayload) => {
console.log('[useTaxisSocket] drivers-found', safeStringify(driversPayload, 4000));
setDrivers(driversPayload || []);
onFoundDrivers(driversPayload || []);
setLoading(false);
});


socketRef.current.on('search-error', (msg) => {
console.warn('[useTaxisSocket] search-error', msg);
setError(msg || 'Error en búsqueda via socket');
setLoading(false);
});


socketRef.current.on('trip-ack', (ack) => console.log('[useTaxisSocket] trip-ack', ack));
} catch (e) {
console.warn('[useTaxisSocket] no se pudo inicializar socket', e);
}


return () => {
try {
if (socketRef.current) {
socketRef.current.off('drivers-found');
socketRef.current.off('search-error');
socketRef.current.off('connect');
socketRef.current.off('disconnect');
socketRef.current.disconnect();
socketRef.current = null;
}
} catch (e) {
console.warn('[useTaxisSocket] error limpiando socket', e);
}
};
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

const buscarTaxistas = useCallback((payload = {}) => {
if (!socketRef.current || !socketRef.current.connected) {
setError('Socket no conectado');
return;
}
setLoading(true);
setError(null);
try {
socketRef.current.emit('send-trip', payload, (ack) => {
// ack opcional desde el servidor
console.log('[useTaxisSocket] ack send-trip', ack);
});
} catch (e) {
console.warn('[useTaxisSocket] error emit send-trip', e);
setError(e.message || String(e));
setLoading(false);
}
}, []);


return {
socketRef,
socketConnected: connected,
buscarTaxistas,
loading,
error,
lastDrivers: drivers,
};
}