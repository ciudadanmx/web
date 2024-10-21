import React, { useState, useEffect } from 'react';
import { TbMessageFilled } from "react-icons/tb";

import MessagesMenu from './MessagesMenu.jsx';
import { useAuth0 } from '@auth0/auth0-react';
import '../styles/MessagesIcon.css';

const MessagesIcon = () => {
    const { user, isAuthenticated, getAccessTokenSilently } = useAuth0(); // Obtenemos el email del usuario autenticado
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [messageCount, setMessageCount] = useState(0);
    const [messages, setMessages] = useState([]);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    // Función para obtener los mensajes del usuario desde Strapi
    const fetchMessages = async () => {
        if (!isAuthenticated) return;

        try {
            const token = await getAccessTokenSilently();  // Obtenemos el token para autenticar la solicitud a Strapi
            // Primero, obtenemos el usuario desde Strapi usando el email
            const userResponse = await fetch(`https://tu-strapi-url.com/users?email=${user.email}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const userData = await userResponse.json();
            const userId = userData[0]?.id;  // Obtenemos el ID del usuario

            // Si no obtenemos el ID del usuario, no continuamos
            if (!userId) {
                console.error("No se pudo obtener el ID del usuario");
                return;
            }

            // Ahora, buscamos los mensajes donde el usuario es el receptor (receiver)
            const response = await fetch(`https://tu-strapi-url.com/messages?receiver.id=${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const messagesData = await response.json();
            setMessages(messagesData);  // Guardamos los mensajes obtenidos
            setMessageCount(messagesData.length);  // Guardamos la cantidad de mensajes
        } catch (error) {
            console.error('Error al obtener los mensajes:', error);
        }
    };

    useEffect(() => {
        fetchMessages();  // Llamamos a la función al montar el componente
    }, [isAuthenticated]);

    return (
        <div className="message-icon-container" onClick={toggleMenu}>
            <TbMessageFilled className="message-icon" />
            {messageCount > 0 && <span className="message-count">{messageCount}</span>}

            <MessagesMenu 
                isOpen={isMenuOpen} 
                onClose={() => setIsMenuOpen(false)} 
                messages={messages}  // Pasamos los mensajes al menú de mensajes
            />
        </div>
    );
};

export default MessagesIcon;
