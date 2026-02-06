import express from 'express';
import respuesta from '../../red/respuestas.js';
import controlador from './index.js';
import seguridad from '../usuarios/seguridad.js'; // Middleware de autenticación
import config from '../../config.js';
import { body } from 'express-validator';
import { validationResult } from 'express-validator';



const router = express.Router();
const validacionesVerificar = [
  body('correo').isEmail(),
  body('codigo').isLength({ min: 6, max: 6 })
];

const validacionesCambio = [
  body('correo').isEmail(),
  body('codigo').isLength({ min: 6, max: 6 }),
  body('nuevaPassword').isLength({ min: 6 })
];


// Login: genera token y lo guarda en cookie segura
router.post('/login', login);

// Ruta protegida: solo accesible con token válido
router.get('/protegido', seguridad(), (req, res) => {
  res.json({
    mensaje: 'Acceso autorizado',
    usuario: req.user,
  });
});

//La api de google, estará aquí a salvo
router.get('/mapsapikey', (req, res) => {
  res.json({ apiKey: config.googleMaps.mapsApiKey });
});

// Logout: elimina cookie
router.post('/logout', (req, res) => {
    // Eliminar la cookie 'token' al cerrar sesión
  res.clearCookie('token', {
    httpOnly: true,
    secure: false, // ⚠️ debe coincidir con tu configuración real
    sameSite: 'Lax',
  });

  res.json({ mensaje: 'Sesión cerrada' });
});

// Recuperar contraseña - paso 1: Solicitar código
router.post('/solicitar-cambio', solicitarCambio);

// Recuperar contraseña - paso 2: Verificar código
router.post('/verificar-codigo', validacionesVerificar, verificarCodigo);

// Recuperar contraseña - paso 3: Cambiar la contraseña
router.post('/cambiar-password', cambiarPassword);

// Función de login
async function login(req, res, next) {
  try {
    const token = await controlador.login(req.body.correo, req.body.password); 

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000  // 7 días (duración del token en la cookie)
    });

    respuesta.success(req, res, { mensaje: 'Login exitoso' }, 200);
  } catch (error) {
    next(error);
  }
}

// Función: Solicitar código de recuperación
async function solicitarCambio(req, res, next) {
  try {
    const resultado = await controlador.solicitarCambio(req.body.correo);
    respuesta.success(req, res, resultado, 200);
  } catch (error) {
    next(error);
  }
}

// Función: Verificar código
async function verificarCodigo(req, res, next) {
  try {
    const { correo, codigo } = req.body;
    const resultado = await controlador.verificarCodigo(correo, codigo);
    respuesta.success(req, res, resultado, 200);
  } catch (error) {
    next(error);
  }
  
}

// Función: Cambiar contraseña
async function cambiarPassword(req, res, next) {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return respuesta.error(req, res, errores.array(), 400);
    }

    const { correo, codigo, nuevaPassword } = req.body;
    const resultado = await controlador.cambiarPassword(correo, codigo, nuevaPassword);
    respuesta.success(req, res, resultado, 200);
  } catch (error) {
    next(error);
  }
}


export default  router ;