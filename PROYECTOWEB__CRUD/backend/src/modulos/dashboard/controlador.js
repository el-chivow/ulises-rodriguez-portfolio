// modulos/dashboard/controlador.js

import db from '../../DB/mysql.js';

import imagenes from '../../imagenes/controlador.js'; // o donde lo tengas
const imagenesControlador = imagenes(db); // INICIALIZA EL CONTROLADOR



const TABLA = 'datos';

export default function(dbInyectada) {
  let db = dbInyectada;

  if (!db) {
    db = require('../../DB/mysql');
  }

  // Guardar nueva entrada del dashboard
async function guardarEntrada(data, userId) {
  // Validar latitud y longitud
  if (data.latitud !== null && isNaN(data.latitud)) {
    throw new Error('❌ Latitud debe ser un número o nulo');
  }
  if (data.longitud !== null && isNaN(data.longitud)) {
    throw new Error('❌ Longitud debe ser un número o nulo');
  }

  // Validar campos requeridos: nombre, nombre_negocio y ubicacion
  if (!data.nombre?.trim() || !data.nombre_negocio?.trim() || !data.ubicacion?.trim()) {
    throw new Error('❌ Los campos nombre, nombre_negocio y ubicacion son requeridos y no pueden estar vacíos');
  }

  const nuevaEntrada = {
    nombre: data.nombre,
    descripcion: data.descripcion,
    nombre_encargado: data.nombre_encargado,
    nombre_negocio: data.nombre_negocio,
    ubicacion: data.ubicacion,
    horarios: data.horarios,
    envios: data.envios,
    whatsapp: data.whatsapp,
    informacion_adicional: data.informacion_adicional,
    google_maps: data.google_maps,
    latitud: data.latitud,
    longitud: data.longitud,
    usuarios_id: userId,
    localidad_id: data.localidad_id,
    categoria_id: data.categoria_id,
    subcategoria_id: data.subcategoria_id
  };

  // 👉 Primero guardamos la entrada principal
  const resultado = await db.agregar(TABLA, nuevaEntrada);
  const negocio_id = resultado.insertId;

  // 👉 Insertar calificación inicial (2 estrellas)
  await db.queryRaw(
     `INSERT INTO calificaciones (usuarios_id, negocio_id, calificacion) VALUES (?, ?, ?)`,
    [userId, negocio_id, 2]
  );

  // 👉 También actualizamos el campo `rating` del negocio
await db.actualizar('datos', { rating: 2 }, { negocio_id });


  // 👉 Insertamos los detalles en la tabla intermedia
  if (Array.isArray(data.detalle_ids)) {
    console.log("➡️ Insertando detalles:", data.detalle_ids);

    for (const detalleId of data.detalle_ids) {
      const resultadoInsercion = await db.agregar('detalles_datos', {
        negocio_id,
        detalle_id: detalleId
      });
      console.log("Resultado de la inserción de detalle:", resultadoInsercion);
    }
  }

  return { ...nuevaEntrada, id: negocio_id };
}
  // Obtener todas las entradas del usuario autenticado------------
// Obtener todas las entradas del usuario autenticado
async function obtenerEntradas(userId) {
  const sql = `
    SELECT 
      d.*, 
      GROUP_CONCAT(DISTINCT dd.detalle_id) AS detalle_ids,
      GROUP_CONCAT(DISTINCT det.nombre) AS detalle_nombres
    FROM datos d
    LEFT JOIN detalles_datos dd ON d.negocio_id = dd.negocio_id
    LEFT JOIN detalles det ON dd.detalle_id = det.id
    WHERE d.usuarios_id = ?
    GROUP BY d.negocio_id
  `;

  const resultados = await db.queryRaw(sql, [userId]);

  // Convertir los resultados en el formato adecuado
  return resultados.map(row => ({
    ...row,
    detalle_ids: row.detalle_ids
      ? row.detalle_ids.split(',').map(Number)
      : [],
    detalle_nombres: row.detalle_nombres
      ? row.detalle_nombres.split(',')
      : []
  }));
}
//---------------
async function obtenerEntradaUnica(usuarioId) {
  console.log(`Obteniendo entrada para el usuario con ID: ${usuarioId}`);
  
  try {
    const resultado = await db.query(TABLA, { usuarios_id: usuarioId });

    if (!resultado || resultado.length === 0) {
      console.log(`No se encontró ninguna entrada para el usuario con ID: ${usuarioId}`);
      return null;
    }

    return resultado[0];
  } catch (error) {
    console.error('Error al obtener la entrada:', error);
    throw error;
  }
}

  // Actualizar entrada existente (por ID y validando usuario)
  async function actualizarEntrada(data, userId) {
  
  if (!data.nombre || !data.descripcion || !userId) {
  throw new Error('Faltan campos obligatorios');
}

    const condiciones = {
      negocio_id: data.negocio_id,
      usuarios_id: userId, // seguridad: sólo actualiza si pertenece al usuario
    };

    const camposActualizar = {
      nombre: data.nombre,
      descripcion: data.descripcion,
      nombre_encargado: data.nombre_encargado,
      nombre_negocio: data.nombre_negocio,
      ubicacion: data.ubicacion,
      horarios: data.horarios,
      envios: data.envios,
      whatsapp: data.whatsapp,
      informacion_adicional: data.informacion_adicional,
      google_maps: data.google_maps,
      latitud: data.latitud || null,
      longitud: data.longitud || null,

      localidad_id: data.localidad_id,
      categoria_id: data.categoria_id,
      subcategoria_id: data.subcategoria_id
      
    };

    return db.actualizar(TABLA, camposActualizar, condiciones);
  }

  // Eliminar entrada (por ID y validando usuario)
  async function eliminarEntrada(id, userId) {
    const condiciones = {
      negocio_id: id,
      usuarios_id: userId, // seguridad: sólo elimina si pertenece al usuario
    };

    return db.eliminar(TABLA, condiciones);
  }

  //Para poder obtener el usuario de la tabla usuarios (Se modificó un poco para poder mostar el userName)
  async function obtenerUsuario(id) {
  try {
    const sql = `
      SELECT u.nombre, u.correo, a.usuario
      FROM usuarios u
      JOIN auth a ON u.id = a.id
      WHERE u.id = ?
    `;

    const resultado = await db.queryRaw(sql, [id]);
    return resultado[0];
  } catch (error) {
    console.error('Error al obtener el usuario:', error);
    throw error;
  }
}

//Para la ubicación con los datos lat y long direcamente con la API de google maps-------------------------------

async function guardarUbicacion(data) {
  try {
    return await db.agregar(TABLA, data); // data incluye latitud, longitud, usuarios_id
  } catch (error) {
    console.error("Error al guardar la ubicación:", error);
    throw error;
  }
}
async function obtenerUbicacion(usuarios_id) {
  try {
    // Asumiendo que 'datos' es la tabla donde se guarda la ubicación
    const resultado = await db.query('datos', { usuarios_id });


    // Si hay resultados, devuelve el primer resultado, de lo contrario devuelve null
    return resultado[0] || null;
  } catch (error) {
    console.error("Error al obtener la ubicación:", error);
    throw error;
  }
}


async function actualizarUbicacion({ latitud, longitud }, userId) {
  try {
    const resultado = await db.actualizar(TABLA, { latitud, longitud }, { usuarios_id: userId });

    if (resultado.affectedRows === 0) {
      // No existía: hacemos insert (crear fila nueva)
      return await db.agregar(TABLA, { usuarios_id: userId, latitud, longitud });
    }

    return resultado;
  } catch (error) {
    console.error("Error al actualizar la ubicación:", error);
    throw error;
  }
}
//------------------------------------------------
//CASO ESPECIAL, POR EL TEMA DEL ARREGLO A LA HORA DEL REGISTRO DE LO QUE SE VENDE Y SE MUESTRA AL PUBLICO (CHATGPT ME AYUDÓ A ESTO)-------------------
async function obtenerTodas() {
  const sql = `
    SELECT 
      d.*, 
      GROUP_CONCAT(DISTINCT dd.detalle_id) AS detalle_ids,
      GROUP_CONCAT(DISTINCT det.nombre) AS detalle_nombres
    FROM datos d
    LEFT JOIN detalles_datos dd ON d.negocio_id = dd.negocio_id
    LEFT JOIN detalles det ON dd.detalle_id = det.id
    GROUP BY d.negocio_id
  `;

  // Paso 1: Obtener los resultados de la consulta SQL
  const resultados = await db.queryRaw(sql);

  // Paso 2: Mapear los resultados e incluir las URLs públicas de las imágenes
  const datosConImagenes = await Promise.all(resultados.map(async (row) => {
    const usuarios_id = row.usuarios_id;

    // Obtener la URL de la imagen de perfil pública
    const imagenPerfil = await imagenesControlador.obtenerImagenPerfilPublica(usuarios_id);
    const perfilURL = imagenPerfil
      ? `http://localhost:4000/api/imagenes/publicas/perfil/${usuarios_id}`
      : null;

    // Obtener las URLs de las imágenes de galería públicas
    const galeria = await imagenesControlador.obtenerGaleriaPublica(usuarios_id);
    const galeriaURLs = galeria.map(img => {
  const nombreArchivo = img.ruta.split(/[/\\]/).pop(); // Solo el nombre del archivo
  return `http://localhost:4000/uploads/${nombreArchivo}`;
});

    // Paso 3: Mapear el resultado final agregando las URLs de imágenes
    return {
      ...row,
      detalle_ids: row.detalle_ids
        ? row.detalle_ids.split(',').map(Number)
        : [],
      detalle_nombres: row.detalle_nombres
        ? row.detalle_nombres.split(',')
        : [],
      imagen_perfil_url: perfilURL,
      galeria_urls: galeriaURLs
    };
  }));

  return datosConImagenes;
}
//---------------------------------------------------

//------------------------------------------- TODO ESTE BLOQUE ES PARA LA CALIFICACION POR ESTRELLAS
async function calificarNegocio(usuarioId, negocioId, calificacion) {
  try {
    // Verificar si ya calificó
    const [existe] = await db.queryRaw(`
      SELECT * FROM calificaciones
      WHERE usuarios_id = ? AND negocio_id = ?
    `, [usuarioId, negocioId]);

if (existe) {
  // Ya existe una calificación → bloquear
  throw new Error("Ya calificaste este negocio.");
} else {
  // Insertar nueva calificación
  await db.queryRaw(`
    INSERT INTO calificaciones (usuarios_id, negocio_id, calificacion)
    VALUES (?, ?, ?)
  `, [usuarioId, negocioId, calificacion]);
}

    // Recalcular promedio
    const [promedio] = await db.queryRaw(`
      SELECT AVG(calificacion) AS promedio
      FROM calificaciones
      WHERE negocio_id = ?
    `, [negocioId]);

    const nuevoRating = parseFloat(promedio.promedio || 2); // default a 2 si no hay calificaciones


    // Actualiza en tabla datos
    await db.queryRaw(`
      UPDATE datos SET rating = ?
      WHERE negocio_id = ?
    `, [nuevoRating, negocioId]);

    return nuevoRating;
  } catch (err) {
    console.error("Error en calificarNegocio:", err);
    throw err;
  }
}

async function obtenerCalificacionNegocio(negocioId) {
  try {
    const [resultado] = await db.queryRaw(`
      SELECT rating FROM datos
      WHERE negocio_id = ?
    `, [negocioId]);

    return resultado?.rating || 2; // valor por defecto si no existe
  } catch (err) {
    console.error("Error al obtener la calificación del negocio:", err);
    return null;
  }
}
//--------------------------------------------HASTA AQUI EL BLOQUE DE LA CALIFICACION POR ESTERLLAS
  return {
    guardarEntrada,
    obtenerEntradas,
    actualizarEntrada,
    eliminarEntrada,
    obtenerEntradaUnica,
    obtenerUsuario,
    guardarUbicacion,
     obtenerUbicacion,
    actualizarUbicacion,
    obtenerTodas,
    calificarNegocio,
    obtenerCalificacionNegocio
  };
};