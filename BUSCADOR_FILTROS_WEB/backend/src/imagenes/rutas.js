import express from 'express';
import auth from '../auth/index.js';
import { generalUpload, profileUpload } from './multer.js';
import respuesta from '../red/respuestas.js';
import controlador from '../imagenes/index.js'; // aquí se importa con db ya inyectado


const router = express.Router();

router.get('/galeria', auth.confirmarToken, obtenerImagenes);
router.post('/subir', auth.confirmarToken, generalUpload.array('imagenes', 4), subirImagenes);
router.post('/subir/perfil', auth.confirmarToken, profileUpload.single('imagen'), subirImagenPerfil);
router.delete('/eliminar/:id', auth.confirmarToken, eliminarImagen);

router.get('/galeria/perfil', auth.confirmarToken, obtenerImagenPerfil);
router.delete('/eliminar/perfil/:id', auth.confirmarToken, eliminarImagenPerfil);




async function obtenerImagenes(req, res, next) {
  try {
    const data = await controlador.obtenerImagenes(req);
    respuesta.success(req, res, data, 201);
  } catch (err) {
    next(err);
  }
}

async function subirImagenes(req, res, next) {
  try {
    const data = await controlador.subirImagenes(req);
    respuesta.success(req, res, data, 201);
  } catch (err) {
    next(err);
  }
}

async function eliminarImagen(req, res, next) {
  try {
    const id = req.params.id;
    const data = await controlador.eliminarImagen(id);
    respuesta.success(req, res, data, 200);
  } catch (err) {
    next(err);
  }
}

async function subirImagenPerfil(req, res, next) {
  try {
    const data = await controlador.subirImagenPerfil(req);
    respuesta.success(req, res, data, 201);
  } catch (err) {
    next(err);
  }
}




async function obtenerImagenPerfil(req, res, next) {
  try {
    const data = await controlador.obtenerImagenPerfil(req);
    respuesta.success(req, res, data, 200);
  } catch (err) {
    next(err);
  }
}

async function eliminarImagenPerfil(req, res, next) {
  try {
    const id = req.params.id;
    const userId = req.user.id;

    const data = await controlador.eliminarImagenPerfil(id, userId);
    respuesta.success(req, res, data, 200);
  } catch (err) {
    next(err);
  }
}

//Esto es para la rutas publica de las imagenes que voy a meter a mi dashboard/publicos
//  Ruta pública para imagen de perfil
router.get('/publicas/perfil/:usuarios_id', async (req, res, next) => {
  try {
    const { usuarios_id } = req.params;
    const imagen = await controlador.obtenerImagenPerfilPublica(usuarios_id);

    if (!imagen) {
      return respuesta.error(req, res, 'Imagen de perfil no encontrada', 404);
    }

    res.sendFile(imagen.ruta); // Ruta absoluta al archivo en el servidor
  } catch (err) {
    next(err);
  }
});

//  Ruta pública para galería de imágenes
router.get('/publicas/galeria/:usuarios_id', async (req, res, next) => {
  try {
    const { usuarios_id } = req.params;
    const imagenes = await controlador.obtenerGaleriaPublica(usuarios_id);

    if (!imagenes || imagenes.length === 0) {
      return respuesta.error(req, res, 'No hay imágenes de galería', 404);
    }

    // Generar las URLs correctas para las imágenes de la galería
    const rutas = imagenes.map(img => {
      const filename = img.ruta.split('\\').pop(); // Obtener solo el nombre del archivo (sin ruta completa)
      return `http://localhost:4000/uploads/${filename}`; // Ruta pública relativa
    });

    respuesta.success(req, res, { rutas }, 200);
  } catch (err) {
    next(err);
  }
});



export default router;