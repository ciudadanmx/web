import React from "react";
import { motion } from "framer-motion";
import { Button, Typography, Paper, ListItemIcon, useMediaQuery } from "@mui/material";
import "./MapAnimation.css";
import mapa from "../../assets/mapa.png";
import MapAnimation from './MapAnimation';

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
        height: isMobile ? "200vh" : isTablet ? "120vh" : "100vh",
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
          height: { xs: "180vh", sm: "110vh", md: "88vh" },
        }}
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.8 }}
        transition={{ duration: 0.5 }}
      >
        {/* Título con personalidad moderada */}
        <Typography
          variant="h3"
          gutterBottom
          component={motion.div}
          animate={{ scale: [1, 1.03, 1] }}
          sx={{
             fontFamily: "'schwager-sans', sans-serif",
            fontWeight: 700,
            letterSpacing: "3px",
            color: "#f09fba",
            textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
            height: { xs: 70, md: 110 },
            width: "auto",
            marginBottom: { xs: "10px", sm: "-12px", md: "-25px" },
            textTransform: "capitalize",
            fontSize: { xs: "0.7rem", sm: "1.1rem", md: "2.6rem" },
          }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        >
            <i className="material-icons" style={{ fontSize: "40px", verticalAlign: "middle" }}>
            local_taxi
          </i>{" "}
          Taxi Ciudadano: Tradición y Modernidad
        </Typography>

        <Typography
          variant="body1"
          style={{
            marginBottom: "20px",
            fontFamily: "'molto', sans-serif",
            fontSize: "1.1rem",
          }}
        >
          Experimenta la fusión perfecta entre la tradición de los taxis concesionados y la
          innovación de los servicios por aplicación en CDMX. Para disfrutar de todos estos
          beneficios, es necesario registrarse con tu teléfono.
        </Typography>

        {/* Sección 1 - Alineada a la izquierda */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          whileHover={{
            scale: 1.03,
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
          style={{
            marginBottom: "15px",
            textAlign: "left",
            borderRadius: "8px",
            padding: "8px",
            borderLeft: "4px solid #f09fba",
            paddingLeft: "12px",
          }}
        >
          <Typography
            variant="h6"
            style={{
              display: "flex",
              alignItems: "center",
              fontFamily: "'molto', sans-serif",
              fontWeight: 600,
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, marginRight: "8px" }}>
              <i className="material-icons" style={{ color: "#f09fba" }}>
                attach_money
              </i>
            </ListItemIcon>
            Taxis concesionados con precios competitivos
          </Typography>
          <Typography
            variant="subtitle2"
            color="textSecondary"
            sx={{ fontFamily: "'molto', sans-serif" }}
          >
            Disfruta de tarifas justas y promociones exclusivas para un viaje sin sorpresas.
          </Typography>
        </motion.div>

        {/* Sección 2 - Alineada a la derecha */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          whileHover={{
            scale: 1.03,
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
          style={{
            marginBottom: "15px",
            textAlign: "right",
            borderRadius: "8px",
            padding: "8px",
            borderRight: "4px solid #f09fba",
            paddingRight: "12px",
          }}
        >
          <Typography
            variant="h6"
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              fontFamily: "'molto', sans-serif",
              fontWeight: 600,
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, marginRight: "8px" }}>
              <i className="material-icons" style={{ color: "#f09fba" }}>
                security
              </i>
            </ListItemIcon>
            Seguridad reforzada con tecnología de aplicación
          </Typography>
          <Typography
            variant="subtitle2"
            color="textSecondary"
            sx={{ fontFamily: "'molto', sans-serif" }}
          >
            Tu seguridad es nuestra prioridad. Seguimiento en tiempo real y verificación constante
            de conductores.
          </Typography>
        </motion.div>

        {/* Sección 3 - Alineada a la izquierda */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          whileHover={{
            scale: 1.03,
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
          style={{
            marginBottom: "20px",
            textAlign: "left",
            borderRadius: "8px",
            padding: "8px",
            borderLeft: "4px solid #f09fba",
            paddingLeft: "12px",
          }}
        >
          <Typography
            variant="h6"
            style={{
              display: "flex",
              alignItems: "center",
              fontFamily: "'molto', sans-serif",
              fontWeight: 600,
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, marginRight: "8px" }}>
              <i className="material-icons" style={{ color: "#f09fba" }}>
                loyalty
              </i>
            </ListItemIcon>
            Beneficios exclusivos en CDMX
          </Typography>
          <Typography
            variant="subtitle2"
            color="textSecondary"
            sx={{ fontFamily: "'molto', sans-serif" }}
          >
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
            fontFamily: "'molto', sans-serif",
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
