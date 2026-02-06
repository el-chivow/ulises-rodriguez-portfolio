import express from 'express';
import respuesta from '../../red/respuestas.js';
import { body, validationResult } from 'express-validator';
import db from '../../DB/mysql.js';


import bcrypt from 'bcrypt';





const router = express.Router();


// Middleware de validación y sanitización
const validacionesRegistro = [
  body('nombre')
  .trim()
  .escape()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ max: 100 }).withMessage('Máximo 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s.'-]+$/)
    .withMessage('Nombre con caracteres no permitidos'),

  body('correo')
    .isEmail().withMessage('Correo inválido'),

  body('usuario')
  .trim()
  .escape()
    .notEmpty().withMessage('El usuario es obligatorio')
    .isLength({ min: 3, max: 30 }).withMessage('Debe tener entre 3 y 30 caracteres')
    .matches(/^[a-zA-Z0-9_.-]+$/)
    .withMessage('El usuario solo puede contener letras, números, punto (.), guión (-) o guión bajo (_). Ejemplo: juan_perez23'),


  body('password')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
    .withMessage('Debe incluir una mayúscula, una minúscula y un número')
];





//Ruta segura
router.post('/register', validacionesRegistro, async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return respuesta.error(req, res, errores.array(), 400);
    }

    const { nombre, correo, usuario, password } = req.body;

    // 🔎 Verificar si el correo ya está registrado
    const correoExistente = await db.queryRaw('SELECT id FROM usuarios WHERE correo = ?', [correo]);
    console.log('correoExistente:', correoExistente);

    if (correoExistente && correoExistente.length > 0) {
      return respuesta.error(req, res, '⚠️ El correo electrónico ya está registrado', 409);
    }

    // 🔎 Verificar si el usuario ya está registrado
    const usuarioExistente = await db.queryRaw('SELECT id FROM auth WHERE usuario = ?', [usuario]);
    console.log('usuarioExistente:', usuarioExistente);

    if (usuarioExistente && usuarioExistente.length > 0) {
      return respuesta.error(req, res, '⚠️ El nombre de usuario ya está en uso', 409);
    }

    // ✅ Insertar en `usuarios`
    const resultadoUsuario = await db.queryRaw(
      'INSERT INTO usuarios (nombre, correo) VALUES (?, ?)',
      [nombre, correo]
    );

    const idUsuario = resultadoUsuario.insertId;

    // 🔐 Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Insertar en tabla `auth`
    await db.queryRaw(
      'INSERT INTO auth (id, usuario, password) VALUES (?, ?, ?)',
      [idUsuario, usuario, hashedPassword]
    );

    return respuesta.success(req, res, {
      mensaje: '✅ Usuario registrado exitosamente',
      id: idUsuario
    }, 201);

  } catch (error) {
    console.error("Error en registrar:", error);
    return respuesta.error(req, res, `❌ Error al registrarse: ${error.message}`, 500);
  }
});



export default router;