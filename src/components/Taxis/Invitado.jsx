import React from "react";
import { motion } from "framer-motion";
import { Button, Typography, Paper, ListItemIcon, useMediaQuery } from "@mui/material";
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
  const isMobile = useMediaQuery("(max-width:600px)");
  // Integración para tablet
  const isTablet = useMediaQuery("(min-width:601px) and (max-width:1024px)");

  return (
    <motion.div
      style={{
        position: "relative",
        width: "100%",
        // Ajuste de altura para tablet
        height: isMobile ? "200vh" : isTablet ? "120vh" : "95vh",
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
        sx={{
          position: "absolute",
          zIndex: 3,
          textAlign: "center",
          borderRadius: "10px",
          padding: "20px",
          background: `linear-gradient(rgba(255, 255, 255, 0.65), rgba(255, 255, 255, 0.70)), url(${mapa})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          // Integración de breakpoint tablet (sm) en MUI
          width: { xs: "80%", sm: "90%", md: "90%" },
          height: { xs: "180vh", sm: "110vh", md: "80vh" },
        }}
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.8 }}
        transition={{ duration: 0.5 }}
      >
        {/* 🎤 Título animado */}
        <Typography
          variant="h5"
          gutterBottom
          component={motion.div}
          animate={{ scale: [1, 1.05, 1] }}
          sx={{
            height: { xs: 66, md: 100 },
            width: "auto",
            marginBottom: { xs: "10px", sm:"-12px", md:"-25px" },
          }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        >
          <i
            className="material-icons"
            style={{ fontSize: "40px", color: "#f09fba", verticalAlign: "middle" }}
          >
            local_taxi
          </i>{" "}
          Ciudadan Taxi... Lo Mejor de 2 Mundos...
        </Typography>

        <Typography variant="body1" style={{ marginBottom: "20px" }}>
          Experimenta la fusión perfecta entre la tradición de los taxis concesionados y la
          innovación de los servicios por aplicación en CDMX. Para disfrutar de todos estos
          beneficios, es necesario registrarse con tu teléfono.
        </Typography>

        {/* Sección 1 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{ marginBottom: "15px", textAlign: "left" }}
        >
          <Typography variant="h6" style={{ display: "flex", alignItems: "center" }}>
            <ListItemIcon sx={{ minWidth: 0, marginRight: "8px" }}>
              <i className="material-icons" style={{ color: "#f09fba" }}>
                attach_money
              </i>
            </ListItemIcon>
            Taxis concesionados con precios competitivos
          </Typography>
          <Typography variant="subtitle2" color="textSecondary">
            Disfruta de tarifas justas y promociones exclusivas para un viaje sin sorpresas.
          </Typography>
        </motion.div>

        {/* Sección 2 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          style={{ marginBottom: "15px", textAlign: "left" }}
        >
          <Typography variant="h6" style={{ display: "flex", alignItems: "center" }}>
            <ListItemIcon sx={{ minWidth: 0, marginRight: "8px" }}>
              <i className="material-icons" style={{ color: "#f09fba" }}>
                security
              </i>
            </ListItemIcon>
            Seguridad reforzada con tecnología de aplicación
          </Typography>
          <Typography variant="subtitle2" color="textSecondary">
            Tu seguridad es nuestra prioridad. Seguimiento en tiempo real y verificación constante
            de conductores.
          </Typography>
        </motion.div>

        {/* Sección 3 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          style={{ marginBottom: "20px", textAlign: "left" }}
        >
          <Typography variant="h6" style={{ display: "flex", alignItems: "center" }}>
            <ListItemIcon sx={{ minWidth: 0, marginRight: "8px" }}>
              <i className="material-icons" style={{ color: "#f09fba" }}>
                loyalty
              </i>
            </ListItemIcon>
            Beneficios exclusivos en CDMX
          </Typography>
          <Typography variant="subtitle2" color="textSecondary">
            Paga solo el 10% de tus viajes con Laborys y accede a servicios premium para el
            ciudadano moderno.
          </Typography>
        </motion.div>

        {/* Botón con mayor caché */}
        <Button
          variant="contained"
          sx={{
            marginTop: "15px",
            backgroundColor: "#FF1493", // Rosa fuerte
            color: "white",
            fontWeight: "bold",
            padding: "10px 20px",
            fontSize: "1rem",
          }}
          onClick={onRegister}
          component={motion.button}
          whileHover={{
            scale: 1.1,
            boxShadow: "0px 0px 12px rgba(255, 255, 0, 0.9)",
          }}
          transition={{ duration: 0.3 }}
          startIcon={
            <i className="material-icons" style={{ color: "white", fontSize: "1.3rem" }}>
              person_pin_circle
            </i>
          }
        >
          Únete y Viaja Seguro
        </Button>
      </Paper>
    </motion.div>
  );
};

export default Invitado;
