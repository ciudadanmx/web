import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import {
    Box,
    Container,
    Paper,
    Grid,
    TextField,
    Button,
    Typography,
    MenuItem,
    InputLabel,
    Divider,
} from '@mui/material';

import '../../quillConfig.js';     // esto que corre la línea de registro

//import { DatePicker } from '@mui/x-date-pickers';
import { useForm, Controller } from 'react-hook-form';
import dayjs from 'dayjs';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useCurso } from '../../hooks/useCurso.jsx';
import { useSnackbar } from 'notistack';

import {
    colorBotonSecundario,
    colorBordeBotonSecundario,
    colorFondoBotonSecundario,
    colorBotonSecundarioHoover,
    colorFondoBotonSecundarioHoover,
    colorControlSecundario,
    colorControlSecundarioHoover,
    degradadoIconos,
    botonEditor,
    botonEditorBorde,
    botonEditorFondoHoover,
    botonEditorBordeHoover,
} from '../../styles/ColoresBotones.jsx';

const AgregarCurso = () => {
    const { enqueueSnackbar } = useSnackbar();
    const {
        categorias,
        crearCurso,
        subirMedia,
        loading: loadingHook,
        error: errorHook,
    } = useCurso();

    const {
        handleSubmit,
        register,
        control,
        reset,
        watch,
        setError,
        setValue,
        clearErrors,
        formState: { errors },
    } = useForm({
        defaultValues: {
            titulo: '',
            resumen: '',
            contenido: '',
            //contenido_restringido: '',
            restringido: false,
            status: 'publicado',
            tags: '',
            fecha_publicacion: dayjs(),
            categoria: '',
        },
    });

    const categoriaSeleccionada = watch('categoria');  
    
    const quillModules = useMemo(() => ({
        toolbar: [
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            [{ font: [] }],
            [{ size: ['small', false, 'large', 'huge'] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ color: [] }, { background: [] }],
            [{ script: 'sub' }, { script: 'super' }],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ indent: '-1' }, { indent: '+1' }],
            [{ align: [] }],
            ['blockquote', 'code-block'],
            [{ direction: 'rtl' }],
            ['link', 'image', 'video'],
            ['clean']
        ],    
    }), []);
    const quillRefLibre = useRef(null);
    const [portadaFiles, setPortadaFiles] = useState([]);
    const [galeriaFiles, setGaleriaFiles] = useState([]);
    //const [galeriaRestringidaFiles, setGaleriaRestringidaFiles] = useState([]);
    const [videosFiles, setVideosFiles] = useState([]);
    //const [videosRestringidosFiles, setVideosRestringidosFiles] = useState([]);

    const [portadaPreview, setPortadaPreview] = useState([]);
    const [galeriaPreview, setGaleriaPreview] = useState([]);
    //const [galeriaRestringidaPreview, setGaleriaRestringidaPreview] = useState([]);
    const [videosPreview, setVideosPreview] = useState([]);
    //const [videosRestringidosPreview, setVideosRestringidosPreview] = useState([]);
    const [subiendo, setSubiendo] = useState(false);
    const [mensaje, setMensaje] = useState('');
    //const [htmlModeRestringido, setHtmlModeRestringido] = useState(false);
    const [htmlMode, setHtmlMode] = useState(false);

    const crearPreviews = (files) =>
    Array.from(files).map((file) => {
        const url = URL.createObjectURL(file);
        return { url, type: file.type };
    });

    const handlePortadaChange = (e) => {
        const files = e.target.files;
        setPortadaFiles(files);
        setPortadaPreview(crearPreviews(files));
        if (files.length === 0) {
            setError('portada', { type: 'required', message: 'La portada es obligatoria' });
        } else {
            clearErrors('portada');
        }
    };

    const handleGaleriaChange = (e) => {
        const files = e.target.files;
        setGaleriaFiles(files);
        setGaleriaPreview(crearPreviews(files));
    };

    /* const handleGaleriaRestringidaChange = (e) => {
        const files = e.target.files;
        setGaleriaRestringidaFiles(files);
        setGaleriaRestringidaPreview(crearPreviews(files));
        clearErrors('galeriaRestringida');
    }; */

    // Validación antes de enviar para archivos
    const validarArchivos = () => {
        let valido = true;
        if (portadaFiles.length === 0) {
            setError('portada', { type: 'required', message: 'La portada es obligatoria' });
            valido = false;
        }
        clearErrors(['galeria', 'videos']);
        return valido;
    };


    const onSubmit = async (data) => {
        console.log("Galería restringida:", galeriaFiles);
        setMensaje('');
        clearErrors();
        if (!validarArchivos()) {
            enqueueSnackbar('Por favor corrige los errores en los archivos', { variant: 'error' });
            return;
        }
        setSubiendo(true);
        try {
            const media = {};

            if (portadaFiles.length) {
                media.portada = await subirMedia(portadaFiles);
            }
            if (galeriaFiles.length) {
                media.galeria = await subirMedia(galeriaFiles);
            }
            /* if (galeriaRestringidaFiles.length) {
                media.galeria_restringida = await subirMedia(galeriaRestringidaFiles);
                //console.log("Galería restringida:", e.target.files.galeria_restringida);
                console.log('Galería restringida subida:', media.galeria_restringida);
            } */
            if (videosFiles.length) {
                media.videos = await subirMedia(videosFiles);
            }
            /* if (videosRestringidosFiles.length) {
                media.videos_restringidos = await subirMedia(videosRestringidosFiles);
            } */

            console.log("Galería restringida subida:", media.galeria);

            const payload = {
                titulo: data.titulo,
                resumen: data.resumen,
                contenido: data.contenido,
                /* contenido_restringido: data.contenido_restringido, */
                restringido: data.restringido,
                status: data.status,
                tags: data.tags
                .split(',')
                .map((t) => t.trim())
                .filter((t) => t),
                fecha_publicacion: data.fecha_publicacion.toISOString(),
                categoria: data.categoria,
            };

            await crearCurso(payload, media);

            setMensaje('Curso creado correctamente');
            enqueueSnackbar('Curso creado correctamente', { variant: 'success' });
            reset({
                titulo: '',
                resumen: '',
                contenido: '',
                /* contenido_restringido: '', */
                restringido: false,
                status: 'publicado',
                tags: '',
                fecha_publicacion: dayjs(),
                categoria: '',
            });
            setPortadaFiles([]);
            setGaleriaFiles([]);
            //setGaleriaRestringidaFiles([]);
            setVideosFiles([]);
            //setVideosRestringidosFiles([]);
            setPortadaPreview([]);
            setGaleriaPreview([]);
            //setGaleriaRestringidaPreview([]);
            setVideosPreview([]);
            //setVideosRestringidosPreview([]);
        } catch (err) {
            console.error(err);
            enqueueSnackbar(`Error: ${err.message}`, { variant: 'error' });
            setMensaje(`Error: ${err.message}`);
        } finally {
            setSubiendo(false);
        }
    };

    const restringido = watch('restringido');

    useEffect(() => {
        console.log('Categorías cargadas:', categorias);

        if (categorias.length > 0) {
            const defaultCat = categorias.find(
            (cat) =>
                cat.slug?.toLowerCase() === 'no-clasificados' ||
                cat.nombre?.toLowerCase() === 'no clasificados'
            );

            console.log('Categoría por defecto encontrada:', defaultCat);

            if (defaultCat) {
                setValue('categoria', defaultCat.id);
                console.log('Se estableció la categoría con setValue:', defaultCat.id);
            } else {
                console.log('No se encontró categoría por defecto.');
            }
        }
    }, [categorias, setValue]);

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    <Box
                        component="span"
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 24,
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                background: degradadoIconos,
                                color: '#000',
                                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                                mr: 1.5,
                                transform: 'rotate(-6deg)',
                            }}
                        >
                    📝
                    </Box>
                    Agregar Curso
                </Typography>

                <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={2}>
                        {/* Título */}
                    <Grid item xs={12}>
                        <TextField
                            label="Título"
                            fullWidth
                            {...register('titulo', { required: 'Ingresa un título' })}
                            error={!!errors.titulo}
                            helperText={errors.titulo?.message}
                        />
                    </Grid>

                    {/* Resumen */}
                    <Grid item xs={12}>
                    <TextField label="Resumen" fullWidth multiline rows={2} {...register('resumen')} />
                    </Grid>

                    

                    {/* Contenido libre (WYSIWYG con HTML editable) */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" gutterBottom>
                        Contenido: (HTML)
                        </Typography>
                        <Controller
                            name="contenido"
                            control={control}
                            defaultValue=""    // <-- Aquí garantizamos un string, nunca undefined
                            render={({ field }) => (
                                <>
                                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                        <Button
                                            onClick={() => setHtmlMode(!htmlMode)}
                                            variant="outlined"
                                            size="small"
                                            sx={{
                                                color: botonEditor,
                                                borderColor: botonEditorBorde,
                                                '&:hover': {
                                                backgroundColor: botonEditorFondoHoover,
                                                borderColor: botonEditorBordeHoover,
                                                color: botonEditorBordeHoover,
                                                },
                                            }}
                                        >
                                            {htmlMode ? 'Editor Visual' : 'Editor HTML'}
                                        </Button>
                                        
                                    </Box>
                                    <Box sx={{ 
                                                display: 'flex', 
                                                gap: 1, 
                                                mb: 1,
                                                height: '100%',
                                                marginBottom: '1rem',
                                                border: '2px solid #6e862a',
                                                borderRadius: 8,
                                                color: '#2e2e2e',
                                            }}>
                                    {htmlMode ? (
                                        
                                        <TextField
                                            key="html"
                                            multiline
                                            minRows={8}
                                            fullWidth
                                            value={field.value} 
                                            onChange={e => field.onChange(e.target.value)}
                                            variant="outlined"
                                        />
                                    ) : (
                                        <ReactQuill
                                            key="visual"
                                            ref={quillRefLibre} 
                                            theme="snow"
                                            value={field.value}
                                            onChange={(content, delta, source, editor) => {
                                                field.onChange(editor.getHTML());
                                            }}
                                            style={{ height: '200px', marginBottom: '1rem' }}
                                            modules={quillModules}
                                        />
                                    )}
                                </Box>
                                </>
                            )}
                        />

                    </Grid><Box>
                    <Divider style={{ marginTop: '5px', marginBottom: '5px' }} />
                    <br /><br />        
                    {/* Checkbox para restringido */}
                  </Box>

                   

                    {/* Status */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            className="restringido"
                            label="Status"
                            select
                            fullWidth
                            defaultValue="publicado"
                            {...register('status')}
                            sx={{
                                '& label': {
                                    color: colorControlSecundario,
                                },
                                '& .MuiInputBase-root': {
                                    color: colorControlSecundario, // texto seleccionado
                                    borderColor: colorControlSecundario,
                                },
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                        borderColor: colorControlSecundario, // borde normal
                                    },
                                    '&:hover fieldset': {
                                        borderColor: colorControlSecundarioHoover, // borde hover
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: colorControlSecundarioHoover, // borde al enfocar
                                    },
                                },
                                '& .MuiSvgIcon-root': {
                                    color: colorControlSecundario, // ícono del desplegable
                                },
                            }}
                        >
                            <MenuItem value="borrador">Borrador</MenuItem>
                            <MenuItem value="publicado">Publicado</MenuItem>
                            <MenuItem value="archivado">Archivado</MenuItem>
                            <MenuItem value="activo">Activo</MenuItem>
                            <MenuItem value="ya_encurso">Ya en Curso</MenuItem>
                        </TextField>

                    </Grid>

                    {/* Categoría */} 
                    <Grid item xs={12} sm={6} className="restringido">
                        <TextField
                            label="Categoría"
                            select
                            fullWidth
                            value={categoriaSeleccionada} // ← esto asegura que se muestre la selección actual
                            {...register('categoria', { required: 'Categoría obligatoria' })}
                            error={!!errors.categoria}
                            helperText={errors.categoria?.message}
                            sx={{
                                '& label': {
                                    color: colorControlSecundario,
                                },
                                '& .MuiInputBase-root': {
                                    color: colorControlSecundario,
                                    borderColor: colorControlSecundario,
                                },
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                        borderColor: colorControlSecundario,
                                    },
                                    '&:hover fieldset': {
                                        borderColor: colorControlSecundarioHoover,
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: colorControlSecundario, 
                                    },
                                },
                                '& .MuiSvgIcon-root': {
                                    color: colorControlSecundario,
                                },
                            }}
                        >
                            {categorias.map((cat) => (
                                <MenuItem key={cat.id} value={cat.id}>
                                    {cat.nombre}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    {/* Fecha de publicación */}
                    <Grid item xs={12} sm={6}>
                        <Controller
                            control={control}
                            name="fecha_publicacion"
                            render={({ field }) => (
                                <DateTimePicker
                                    label="Fecha y hora de publicación"
                                    value={field.value}
                                    onChange={(newValue) => field.onChange(newValue)}
                                    renderInput={(params) => <TextField fullWidth {...params} />}
                                />
                            )}
                        />
                    </Grid>

                    {/* Tags */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Tags (separados por coma)"
                            fullWidth
                            {...register('tags')}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <InputLabel required>Portada (imagen o video)</InputLabel>

                        <input
                            id="portada-input"
                            type="file"
                            accept="image/*,video/*"
                            onChange={handlePortadaChange}
                            multiple={false}
                            style={{ display: 'none' }}
                        />

                        <label htmlFor="portada-input">
                            <Button
                                variant="outlined"
                                component="span"
                                sx={{
                                    color: colorBotonSecundario,
                                    borderColor: colorBordeBotonSecundario,
                                    backgroundColor: colorFondoBotonSecundario,
                                    '&:hover': {
                                    backgroundColor: colorFondoBotonSecundarioHoover,
                                    borderColor: colorBotonSecundarioHoover,
                                    color: colorBotonSecundarioHoover,
                                    },
                                    mt: 1, mb: 1
                                }}
                            >
                                Seleccionar archivo
                            </Button>
                        </label>

                        {errors.portada && (
                            <Typography color="error" variant="body2">
                                {errors.portada.message}
                            </Typography>
                        )}

                        {portadaPreview.length > 0 &&
                            portadaPreview.map((file, index) =>
                                file.type.startsWith('image/') ? (
                                    <img
                                        key={index}
                                        src={file.url}
                                        alt={`Portada Preview ${index}`}
                                        style={{ maxHeight: 150, marginRight: 10 }}
                                    />
                                ) : (
                                    <video
                                        key={index}
                                        src={file.url}
                                        controls
                                        style={{ maxHeight: 150, marginRight: 10 }}
                                    />
                                )
                            )
                        }
                    </Grid>

                    {/* Galería libre (archivos múltiples) */}
                    <Grid item xs={12}>
                        <InputLabel>Galería libre (imágenes/videos)</InputLabel>
                        <label htmlFor="galeria-libre-input">
                            <Button
                                variant="outlined"
                                component="span"
                                sx={{
                                    color: colorBotonSecundario,
                                    borderColor: colorBordeBotonSecundario,
                                    backgroundColor: colorFondoBotonSecundario,
                                    '&:hover': {
                                        backgroundColor: colorFondoBotonSecundarioHoover,
                                        borderColor: colorBotonSecundarioHoover,
                                        color: colorBotonSecundarioHoover,
                                    },
                                }}
                            >
                                Subir archivos
                            </Button>
                        </label>
                        <input
                            id="galeria-libre-input"
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleGaleriaChange}
                            multiple
                            style={{ display: 'none' }}
                        />
                        {galeriaPreview.length > 0 &&
                        galeriaPreview.map((file, index) =>
                            file.type.startsWith('image/') ? (
                            <img
                                key={index}
                                src={file.url}
                                alt={`Galería ${index}`}
                                style={{ maxHeight: 100, marginRight: 10 }}
                            />
                            ) : (
                            <video
                                key={index}
                                src={file.url}
                                controls
                                style={{ maxHeight: 100, marginRight: 10 }}
                            />
                            )
                        )}
                    </Grid>

                    {/* Galería restringida (archivos múltiples) - solo si restringido */}
                    
                    

                    {/* Botón guardar */}
                    <Grid item xs={12}>
                        <Button
                            variant="contained"
                            type="submit"
                            disabled={subiendo || loadingHook}
                            startIcon={
                                subiendo || loadingHook ? (
                                    <span className="material-icons">hourglass_top</span>
                                ) : (
                                    <span className="material-icons">save</span>
                                )
                            }
                            sx={{
                                bgcolor:' #6e862ae0',           
                                '&:hover': {
                                bgcolor: '#8CC701',         
                                },
                                transition: 'all 0.3s ease',  
                            }}
                        >
                            {subiendo || loadingHook ? 'Subiendo...' : 'Guardar curso'}
                        </Button>
                    </Grid>

                    {/* Mensaje */}
                    {mensaje && (
                        <Grid item xs={12}>
                            <Typography
                                variant="body1"
                                color={mensaje.toLowerCase().includes('error') ? 'error' : 'primary'}
                            >
                                {mensaje}
                            </Typography>
                        </Grid>
                    )}
                </Grid>
                </Box>
            </Paper>
        </Container>
    );
};

export default AgregarCurso;