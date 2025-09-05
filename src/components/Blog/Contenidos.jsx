import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import EliminarContenido  from '../../Pages/Blog/EliminarContenido';
import {
  Box,
  Grid,
  Container,
  Typography,
  Button,
  TextField,
  Fade,
  Slide,
  useMediaQuery,
  useTheme,
  Stack,
  Pagination,
} from '@mui/material';
import CategoriasSlider from '../../components/MarketPlace/CategoriasSlider';
import { useCategorias } from '../../hooks/useCategorias';
import { useContenido } from '../../hooks/useContenido';
import ContenidoCard from '../../components/Blog/ContenidoCard';
import ContenidoDetalle from '../../Pages/Blog/Contenido'; 
import '../../styles/Contenidos.css';

const Contenidos = ({ filtros, parametros }) => {

    if (filtros === 'busqueda') {
        var titulo = "Resultados de Búsqueda  «" + (parametros.charAt(0).toUpperCase() + parametros.slice(1)) + "»: ";
    }
    else if (filtros === 'categoria'){
        var titulo = "Contenidos en Categoría  «" + (parametros.charAt(0).toUpperCase() + parametros.slice(1)) + "»: ";
        var mostrarCategorias = false;
    }
    else if (filtros === 'mis-contenidos'){
        var titulo ="»» Tus Contenidos ««:";
        var mostrarCategorias = false;
    }

    else {
        var titulo = '';
        var mostrarCategorias = true;
    }

    //TODO  REEMPLAZAR POR CONTEXTO
  const editor = true;
  const STRAPI_URL = process.env.REACT_APP_STRAPI_URL;
  const clasifica = "contenidos";
  const { getCategorias } = useCategorias('categorias-contenidos');
  const {
    contenidos,
    loading,
    error,
    pagina,
    setPagina,
    porPagina,
    setPorPagina,
    fetchContenidos,
    totalItems,
  } = useContenido();

  const [categorias, setCategorias] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [visible, setVisible] = useState({});
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  // Handlers
  const handleAgregar = () => navigate('/contenidos/agregar-contenido');
  const handleBuscar = () => {
    const slug = busqueda.trim().toLowerCase().replace(/\s+/g, '-');
    if (!slug ) return;
    navigate(`/contenidos/busqueda/${slug}`);
  };
  const handleMis = () => navigate('/contenidos/mis-contenidos');

  // Fetch categories
  useEffect(() => {
    (async () => {
      const cats = await getCategorias();
      setCategorias(cats);
    })();
  }, []);

  // Fetch contenidos whenever pagina o porPagina cambian
  useEffect(() => {
    fetchContenidos();
  }, [pagina, porPagina]);

  // Filter logic
  const filtered = (contenidos || []).filter((item) => {
    const data = item.attributes ?? item;
    if (!filtros) return true;
    if (filtros === 'mis-contenidos') {
  const authorId = (data.autor_email ?? '').trim().toLowerCase();
  const usuarioLogueado = (parametros ?? '').trim().toLowerCase();
console.log('CONTENIDOS:', contenidos);
return authorId === usuarioLogueado;
}
   
    if (filtros === 'categoria') {
  // Debug: muestra la estructura de categoría
  console.log('DATA.categoria →', data.categoria);

  // Extrae el slug según la forma que venga
  let catSlug;
  if (data.categoria?.data?.attributes?.slug) {
    // Forma anidada Strapi
    catSlug = data.categoria.data.attributes.slug;
  } else if (data.categoria?.slug) {
    // Forma plana que viste en consola
    catSlug = data.categoria.slug;
  }

  console.log('Comparando slug de categoría:', catSlug, 'vs parámetros:', parametros);
  return catSlug === parametros;
}
    if (filtros === 'busqueda') {
      const term = parametros?.toLowerCase() || '';
      const titulo = (data.titulo ?? data.nombre ?? '').toLowerCase();
      const libre = (data.contenido_libre ?? '').toLowerCase();
      const restringido = (data.contenido_restringido ?? '').toLowerCase();
      const tagsSource = data.tags?.data ?? data.tags;
      const tagsArr = Array.isArray(tagsSource)
        ? tagsSource.map((t) => (t.attributes?.nombre ?? t.slug ?? t).toLowerCase())
        : [];
      const tagsMatch = tagsArr.some((t) => t.includes(term));
      return (
        titulo.includes(term) ||
        libre.includes(term) ||
        restringido.includes(term) ||
        tagsMatch
      );
    }
    return true;
  });

  // Default sort if no filtros
  const toRender = !filtros
    ? [...filtered].sort((a, b) => {
        const da = (a.attributes ?? a).fecha_publicacion;
        const db = (b.attributes ?? b).fecha_publicacion;
        return new Date(db) - new Date(da);
      })
    : filtered;

  // IntersectionObserver for animations
  const observer = useRef();
  useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const id = e.target.getAttribute('data-id');
            setVisible((v) => ({ ...v, [id]: true }));
            observer.current.unobserve(e.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    document.querySelectorAll('.contenido-card').forEach((c) => observer.current.observe(c));
    return () => observer.current.disconnect();
  }, [toRender]);


  const paginar=toRender.length >= porPagina || pagina > 1; 
    //const paginar=true;
  

  return (
  <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
    {/* Search & Controls */}
    <Slide direction="down" in timeout={400}>
      <Box
        sx={{
          mb: 3,
          backgroundColor: '#fff',
          p: 2,
          borderRadius: 3,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
        >
          {/* Buscar */}
          <TextField
            variant="outlined"
            size="small"
            placeholder="Buscar contenido..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                console.log('Buscando:', e.target.value);
                setBusqueda(e.target.value);
                handleBuscar();
              }
            }}
            sx={{
              flex: 1,
              minWidth: { xs: '100%', md: '250px' },
              backgroundColor: '#f9f9f9',
              borderRadius: 2,
            }}
          />

          <Button
            onClick={handleBuscar}
            variant="contained"
            size="small"
            sx={{
              backgroundColor: '#000',
              color: '#fff200',
              borderRadius: 2,
              '&:hover': { backgroundColor: '#222', transform: 'scale(1.05)' },
            }}
          >
            <span className="material-icons">search</span>
          </Button>

          {/* Botones de editor */}
          {editor && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                onClick={handleMis}
                variant="outlined"
                size="small"
                sx={{
                  color: '#000',
                  borderColor: '#000',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': { backgroundColor: '#f0f0f0', transform: 'scale(1.03)' },
                }}
                startIcon={<span className="material-icons">article</span>}
              >
                Mis contenidos
              </Button>

              <Button
                onClick={handleAgregar}
                variant="contained"
                size="small"
                sx={{
                  backgroundColor: '#fff200',
                  color: '#000',
                  borderRadius: 2,
                  '&:hover': { backgroundColor: '#e6d900', transform: 'scale(1.05)' },
                }}
                startIcon={<span className="material-icons">add_circle</span>}
              >
                Crear
              </Button>
            </Stack>
          )}
        </Stack>
      </Box>
    </Slide>



    


    {/* Contenidos */}
    <Box mt={5}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        <u className="contenidos-titulo">{ titulo }</u>
      </Typography>


      {categorias.length > 0 && (
  <Fade in timeout={400}>
    <Box>
      

      {mostrarCategorias === true && (
        <>
          <Typography variant="h6" align="center" fontWeight={700} sx={{ mb: 2 }}>
            <u className="contenidos-titulo">Categorías</u>
          </Typography>

          <CategoriasSlider
            forma={'hexagono'}
            categorias={Array.isArray(categorias)
              ? categorias.map((c) => ({
                  nombre: c.attributes.nombre,
                  slug: c.attributes.slug,
                  imagen: `${STRAPI_URL}${c.attributes.imagen?.data?.attributes?.url}`,
                }))
              : []}
            clasifica={'contenidos'}
          />
          <Typography variant="h6" align="center" fontWeight={700} sx={{ mb: 2 }}>
            <u className="contenidos-titulo">Contenidos Recientes:...</u>
          </Typography>
        </>
      )}

      {mostrarCategorias !== true && (
        <Fade in timeout={400}>
          <Box
            onClick={() => navigate('/contenidos')}
             sx={{
                backgroundColor: '#e6f4ea',
                borderRadius: 1,
                px: 1.5,
                py: 0.5,
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                color: 'green',
                fontSize: '0.875rem',
                boxShadow: '0px 2px 6px rgba(0,0,0,0.08)',
                marginTop: '-20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                backgroundColor: '#d0ebdc',
                textDecoration: 'underline',
                transform: 'scale(1.02)',
                },
            }}
          >
            « Volver a Directorio de Contenidos
          </Box>
        </Fade>
      )}


    </Box>
  </Fade>
)}


      {filtros === 'editar' ? (
        <ContenidoDetalle slug={parametros} />
      ) : filtros === 'eliminar' ? (
        <EliminarContenido slug={parametros} />
      ) : (
        <Grid container spacing={2}>
          {loading && (
            <Grid item xs={12}>
              <Typography align="center">Cargando contenidos...</Typography>
            </Grid>
          )}
          {error && (
            <Grid item xs={12}>
              <Typography color="error" align="center">
                Error al cargar contenidos
              </Typography>
            </Grid>
          )}
          {!loading && toRender.length === 0 && (
            <Grid item xs={12}>
              <Typography align="center">No hay contenidos aún.</Typography>
            </Grid>
          )}
          {toRender.map((item, i) => {
            const { categoria, ...restData } = item.attributes ?? item;
            const data = restData;
            const categoriaNombre = categoria?.nombre || null;
            const isVis = visible[item.id];
            return (
              <Grid
                key={item.id}
                item
                xs={12}
                sm={6}
                md={4}
                data-id={item.id}
                className="contenido-card"
                sx={{
                  opacity: isVis ? 1 : 0,
                  transform: isVis ? 'translateY(0)' : 'translateY(20px)',
                  transition: `all 0.6s ease ${i * 0.1}s`,
                }}
              >
                <ContenidoCard {...data} categoria={categoriaNombre} id={item.id} />
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Paginación */}
      {!loading && paginar === true && (
        <Grid container spacing={2} sx={{ mt: 3, justifyContent: 'center', alignItems: 'center' }}>
          <Pagination
            count={Math.ceil(totalItems / porPagina)}
            page={pagina}
            onChange={(_, v) => setPagina(v)}
          />
          <TextField
            select
            value={porPagina}
            onChange={(e) => setPorPagina(Number(e.target.value))}
            SelectProps={{ native: true }}
            size="small"
            sx={{ width: 80, ml: 2 }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
          </TextField>
        </Grid>
      )}
    </Box>
  </Container>
);
};

export default Contenidos;
