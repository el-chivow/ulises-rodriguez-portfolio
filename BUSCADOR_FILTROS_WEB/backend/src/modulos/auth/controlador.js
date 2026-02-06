import bcrypt from 'bcrypt';
import * as auth from '../../auth/index.js';
import enviarCorreoRecuperacion from './correoRecuperacion.js'; // ← función que envía el correo
import dbPorDefecto from '../../DB/mysql.js'; // ESM puro


function generarCodigo() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 dígitos
}


export default function (dbInyectada = dbPorDefecto) {
    const db = dbInyectada;  

      const TABLA_AUTH = 'auth';
      const TABLA_USUARIOS = 'usuarios';
      const TABLA_RECUP = 'recuperaciones';

      async function solicitarCambio(correo) {
      const usuario = (await db.query(TABLA_USUARIOS, { correo }))[0];
      if (!usuario) throw new Error('Correo no encontrado');

      const codigo = generarCodigo();
      const expiracion = new Date(Date.now() + 10 * 60 * 1000); // 10 min

      await db.agregar(TABLA_RECUP, {
        correo,
        codigo,
        expiracion,
        usado: false,
      });

      await enviarCorreoRecuperacion(correo, codigo);
      return { mensaje: 'Código enviado al correo' };
    }

      async function verificarCodigo(correo, codigo) {
        const sql = `SELECT * FROM recuperaciones WHERE correo = ? AND codigo = ? AND usado = false`;
        const resultados = await db.queryRaw(sql, [correo, codigo]);

        const intento = resultados[0];
        if (!intento) throw new Error('Código inválido');

        const ahora = new Date();
        if (new Date(intento.expiracion) < ahora) throw new Error('Código expirado');

        return { validado: true };
      }



async function cambiarPassword(correo, codigo, nuevaPassword) {
  try {
    // Verifica si el código es válido
    const consulta = `SELECT * FROM recuperaciones WHERE correo = ? AND codigo = ? AND usado = false`;
    const resultados = await db.queryRaw(consulta, [correo, codigo]);

    const intento = resultados[0];

    if (!intento) throw new Error('Código inválido o ya usado');
    if (new Date(intento.expiracion) < new Date()) throw new Error('Código expirado');

    // Cambiar la contraseña
    const usuario = (await db.query('usuarios', { correo }))[0];
    if (!usuario) throw new Error('Usuario no encontrado');

    const passwordHasheado = await bcrypt.hash(nuevaPassword, 10); // Mejor usar 10 para un hash más seguro
    await db.actualizar('auth', { password: passwordHasheado }, { id: usuario.id });

    // Marcar el código como usado
    await db.actualizar('recuperaciones', { usado: true }, { correo, codigo });

    return { mensaje: 'Contraseña actualizada correctamente' };
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    throw error; // Lanza el error para ser manejado por el middleware de Express
  }
}


    // Recuperar correo y contraseña desde la base de datos
  async function obtenerCredencialesCorreo() {
    try {
      // Hacemos una consulta a la tabla 'auth' con el id del usuario que necesites
      const resultado = await db.query('SELECT u.correo, a.password FROM usuarios u JOIN auth a ON u.id = a.id WHERE u.id = ?', [1]);

      // Verifica que se haya encontrado el usuario
      if (resultado.length === 0) {
        throw new Error('Usuario no encontrado');
      }

      return resultado[0];  // Devuelve el primer resultado (único)
    } catch (error) {
      console.error('Error al obtener credenciales de correo:', error);
      throw error;  // Lanza el error si algo sale mal
    }
  }


    


 











async function login(correo, password) {
  // Paso 1: Buscar al usuario por su correo
  const resultadoUsuario = await db.query(TABLA_USUARIOS, { correo: correo });
  const usuario = resultadoUsuario[0]; // ← aquí accedes al primer usuario

  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }

  // Paso 2: Buscar su contraseña en la tabla auth, usando el id del usuario

  const resultadoAuth = await db.query(TABLA_AUTH, { id: usuario.id });    
  const datosAuth = resultadoAuth[0];

    if (!datosAuth) {
      throw new Error('Credenciales no encontradas');
    }
  
      // Paso 3: Comparar contraseña
    const passwordValida = await bcrypt.compare(password, datosAuth.password);
    if (!passwordValida) {
    throw new Error('Contraseña incorrecta');
    }

        // Paso 4: Generar token con datos del usuario
       return auth.asignarToken({ 
        id: usuario.id, 
        correo: usuario.correo, 
        usuario: datosAuth.usuario });
  }

  async function agregar(data) {
    const authData = {
      id: data.id,
    };

    if (data.usuario) {
      authData.usuario = data.usuario;
    }

    if (data.password) {
      authData.password = await bcrypt.hash(data.password.toString(), 6);
    }

    return db.agregar(TABLA_AUTH, authData);
  }

  return {
    agregar,
    login,
    solicitarCambio,
    verificarCodigo,
    cambiarPassword,
    obtenerCredencialesCorreo
  };
    
};