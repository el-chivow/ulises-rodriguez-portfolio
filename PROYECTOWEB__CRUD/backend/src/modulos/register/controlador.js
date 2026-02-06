import bcrypt from 'bcrypt';
const TABLA = 'usuarios';

export default function (dbInyectada) {
  let db = dbInyectada;

  if (!db) {
    db = require('../../DB/mysql');
  }

    async function agregar(body) {
    const { nombre, correo, usuario, password } = body;

    // Validar si usuario o correo ya existen
    const correoExistente = await db.queryRaw('SELECT id FROM usuarios WHERE correo = ?', [correo]);
    const usuarioExistente = await db.queryRaw('SELECT id FROM auth WHERE usuario = ?', [usuario]);

    if (correoExistente.length > 0 && usuarioExistente.length > 0) {
      const error = new Error('⚠️ Usuario y correo ya están registrados');
      error.status = 409;
      throw error;
    }
    if (correoExistente.length > 0) {
      const error = new Error('⚠️ El correo electrónico ya está registrado');
      error.status = 409;
      throw error;
    }
    if (usuarioExistente.length > 0) {
      const error = new Error('⚠️ El nombre de usuario ya está en uso');
      error.status = 409;
      throw error;
    }

    // Hashea la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = {
      nombre,
      correo,
      usuario,
      password: hashedPassword
    };

    try {
      const resultado = await db.agregar(TABLA, nuevoUsuario);
      return {
        mensaje: '✅ Usuario registrado exitosamente',
        id: resultado.insertId
      };
    } catch (error) {
      const err = new Error('❌ Error al registrar usuario: ' + error.message);
      err.status = 500;
      throw err;
    }
  }

  return {
    agregar
  };
}
