import React from "react";
import { motion } from "framer-motion";
import { Alert, AlertTitle, Button } from "@mui/material";

const EsperandoViaje = ({ handleConductor }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 9999,
        width: "350px", // ancho del cuadro
        padding: "20px",
        backgroundColor: "#FFF200", // Amarillo del logo
        borderRadius: "8px",
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)",
      }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        style={{
          marginBottom: "20px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <svg width="100" height="100" viewBox="0 0 24 24" fill="none">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="#6D6E71"
            strokeWidth="2"
            fill="none"
          />
          <motion.line
            x1="12"
            y1="12"
            x2="12"
            y2="6"
            stroke="#6D6E71"
            strokeWidth="2"
            initial={{ rotate: 0, originX: "12px", originY: "12px" }}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          />
          <motion.line
            x1="12"
            y1="12"
            x2="16"
            y2="12"
            stroke="#6D6E71"
            strokeWidth="2"
            initial={{ rotate: 0, originX: "12px", originY: "12px" }}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          />
        </svg>
      </motion.div>

      <Alert
        severity="info"
        sx={{
          backgroundColor: "#6D6E71",
          color: "#FFF",
          fontSize: "1.2rem",
          fontWeight: "bold",
          mb: 2,
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)",
        }}
      >
        <AlertTitle>Esperando viajes...</AlertTitle>
        Estamos buscando un pasajero para ti. ⏳
      </Alert>

      <Button variant="contained" color="primary" onClick={handleConductor}>
        Cerrar
      </Button>
    </motion.div>
  );
};

export default EsperandoViaje;
