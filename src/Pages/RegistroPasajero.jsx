import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  TextField,
  Button,
  Paper,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  useMediaQuery,
  Grid,
  Box,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import "dayjs/locale/es";
import mapa from "../assets/mapa.png";
import paises from "../assets/paises.json";

const RegistroPasajero = ({ onRegister }) => {
  const isMobile = useMediaQuery("(max-width:600px)");

  const [formData, setFormData] = useState({
    nombres: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    telefono: "",
    codigoPais: "+52",
    fechaNacimiento: null,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: "" }); // Limpia error al modificar campo
  };

  const validarFormulario = () => {
    let newErrors = {};

    // Validación de campos de nombre
    if (!formData.nombres.trim()) {
      newErrors.nombres = "El nombre es obligatorio";
    }
    if (!formData.apellidoPaterno.trim()) {
      newErrors.apellidoPaterno = "El apellido paterno es obligatorio";
    }
    // El apellido materno puede ser opcional; no lo forzamos.

    // Validación de teléfono
    if (!formData.telefono.match(/^\d{10}$/)) {
      newErrors.telefono = "Ingresa un número válido (10 dígitos)";
    }

    // Validación de fecha de nacimiento
    const edad = formData.fechaNacimiento
      ? dayjs().diff(dayjs(formData.fechaNacimiento), "year")
      : 0;
    if (!formData.fechaNacimiento) {
      newErrors.fechaNacimiento = "Selecciona tu fecha de nacimiento";
    } else if (edad < 18) {
      newErrors.fechaNacimiento = "Debes ser mayor de 18 años";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validarFormulario()) {
      onRegister(formData);
    }
  };

  return (
    <motion.div
      // Contenedor que ocupa casi toda la pantalla
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "auto",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <Paper
        elevation={10}
        sx={{
          // Más ancho y altura mínima
          width: isMobile ? "95%" : "60%",
          minHeight: { xs: "80vh", sm: "80vh", md: "80vh" },
          // Fondo rosa con el mapa
          background: `linear-gradient(rgba(232, 50, 201, 0.7), rgba(255, 255, 255, 0.85)), url(${mapa})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backdropFilter: "blur(6px)",
          borderRadius: "12px",
          textAlign: "center",
          // Centrado vertical interno
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          p: 4,
          top: {xs: "13px", sm: "13px", md: "1px"},
          position: "relative",
        }}
        component={motion.div}
        initial={{ y: 30 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Título sin animación de scale */}
        <Typography
          variant="h4"
          fontWeight="bold"
          color="white"
          mb={3}
          style = {{
            position: "relative",
            top: { xs: "30px", sm:"30px", md:"-60em" },
          }}
        >
          🚖 Registro de Pasajero
        </Typography>

        <form onSubmit={handleSubmit}>
          {/* Nombre(s), Apellido Paterno, Apellido Materno */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                label="Nombre(s)"
                variant="outlined"
                fullWidth
                margin="dense"
                value={formData.nombres}
                onChange={(e) => handleChange("nombres", e.target.value)}
                error={!!errors.nombres}
                helperText={errors.nombres}
                
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Apellido Paterno"
                variant="outlined"
                fullWidth
                margin="dense"
                value={formData.apellidoPaterno}
                onChange={(e) => handleChange("apellidoPaterno", e.target.value)}
                error={!!errors.apellidoPaterno}
                helperText={errors.apellidoPaterno}
                
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Apellido Materno (Opcional)"
                variant="outlined"
                fullWidth
                margin="dense"
                value={formData.apellidoMaterno}
                onChange={(e) =>
                  handleChange("apellidoMaterno", e.target.value)
                }
              />
            </Grid>
          </Grid>

          {/* Código de país y teléfono */}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={4} sm={3}>
              <FormControl fullWidth margin="dense">
                <InputLabel>Código</InputLabel>
                <Select
                  value={formData.codigoPais}
                  onChange={(e) => handleChange("codigoPais", e.target.value)}
                >
                  {paises.map((option) => (
                    <MenuItem key={option.code} value={option.code}>
                      <Box display="flex" alignItems="center">
                        <img
                          src={option.flag}
                          alt={option.code}
                          style={{ width: 24, height: 16, marginRight: 8 }}
                        />
                        {option.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={8} sm={9}>
              <TextField
                label="Teléfono"
                variant="outlined"
                fullWidth
                margin="dense"
                type="tel"
                value={formData.telefono}
                onChange={(e) => handleChange("telefono", e.target.value)}
                error={!!errors.telefono}
                helperText={errors.telefono}
              />
            </Grid>
          </Grid>

          {/* Fecha de nacimiento */}
          <DatePicker
            label="Fecha de Nacimiento"
            value={formData.fechaNacimiento}
            onChange={(newValue) => handleChange("fechaNacimiento", newValue)}
            disableFuture
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                margin="dense"
                error={!!errors.fechaNacimiento}
                helperText={errors.fechaNacimiento}
                sx={{ mt: 2 }}
              />
            )}
          />

          {/* Botón de registro */}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              mt: 3,
              bgcolor: "#ff4081",
              color: "white",
              fontWeight: "bold",
              "&:hover": { bgcolor: "#e91e63" },
            }}
            component={motion.button}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Registrarme
          </Button>
        </form>
      </Paper>
    </motion.div>
  );
};

export default RegistroPasajero;
