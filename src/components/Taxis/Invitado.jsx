import React from "react";
import { motion } from "framer-motion";
import { Button, Typography, Paper, List, ListItem, ListItemText } from "@mui/material";
import "./MapAnimation.css";
import mapa from "../../assets/mapa.png";

const MapAnimation = () => {
  return (
    <div className="map-animation-wrapper">
      {/* Fondo con imagen de mapa */}
      <motion.div
        className="map-bg"
        // Pequeño efecto de zoom in/out continuo
        initial={{ scale: 1 }}
        animate={{ scale: 1.05 }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />

      {/* SVG con animaciones de shapes y paths */}
      <motion.svg
        className="map-svg"
        viewBox="0 0 800 600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Path que se dibuja y se borra en bucle */}
        <motion.path
          d="M100,500 C200,300 400,300 600,100"
          fill="none"
          stroke="#ffeb3b"
          strokeWidth="3"
          strokeDasharray="0 1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 4,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />

        {/* Círculo pulsante al inicio del path */}
        <motion.circle
          cx="100"
          cy="500"
          r="10"
          fill="#e99db7"
          initial={{ scale: 1 }}
          animate={{ scale: 1.3 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />

        {/* Polígono que rota en el fondo */}
        <motion.polygon
          points="400,300 450,350 400,400 350,350"
          fill="rgba(255,255,255,0.3)"
          initial={{ rotate: 0, originX: "400", originY: "350" }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </motion.svg>

      {/* Ícono de taxi desplazándose horizontalmente */}
      <motion.div
  className="taxi-icon"
  initial={{ x: -50 }}
  animate={{ x: 800 }}
  transition={{
    duration: 6,
    repeat: Infinity,
    repeatType: "reverse",
    ease: "easeInOut",
  }}
>
  <i className="material-icons" style={{ fontSize: "40px", color: "#e05c88" }}>
    local_taxi
  </i>
</motion.div>

    </div>
  );
};

//export default MapAnimation;


const Invitado = ({ onRegister }) => {
  return (
    <motion.div
      style={{
        position: "relative",
        width: "100%",
        height: "66vh",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <MapAnimation />

      <Paper
        component={motion.div}
        elevation={8}
        style={{
            position: "absolute",
            zIndex: 3,
            textAlign: "center",
            borderRadius: "10px",
            padding: "20px",
            background: `linear-gradient(rgba(255, 255, 255, 0.65), rgba(255, 255, 255, 0.70)), url(${mapa})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
        }}
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.8 }}
        transition={{ duration: 0.5 }}
        >


        {/* 🎤 Animación de pulsación en el título */}
        <Typography
          variant="h5"
          gutterBottom
          component={motion.div}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        >
          <i className="material-icons" style={{ fontSize: "40px", color: "#f09fba", zIndex: 25000 }}>
            local_taxi
          </i> Ciudadan Taxi...
          Lo Mejor de 2 Mundos...
        </Typography>

        <Typography variant="body1">
          Encuentra taxis seguros y rápidos en tu ciudad.
        </Typography>

        {/* 📝 Lista con animación de entrada */}
        <List>
          {["Servicio 24/7", "Precios accesibles", "Conductores verificados"].map((item, index) => (
            <ListItem
              key={index}
              component={motion.div}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 * index, duration: 0.5 }}
            >
              <ListItemText primary={item} />
            </ListItem>
          ))}
        </List>

        {/* 🔥 Botón con efecto de brillo */}
        <Button
            variant="contained"
            style={{
                marginTop: "15px",
                backgroundColor: "#FF1493", // Rosa fuerte
                color: "white", // Para que el texto sea blanco
            }}
            onClick={onRegister}
            component={motion.button}
            whileHover={{
                scale: 1.1,
                boxShadow: "0px 0px 8px rgba(255, 255, 0, 0.8)",
            }}
            transition={{ duration: 0.3 }}
            >
            Registrar
        </Button>

      </Paper>
    </motion.div>
  );
};

export default Invitado;
