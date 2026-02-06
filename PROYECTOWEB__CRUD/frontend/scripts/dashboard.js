let modoEdicion = false;
let idEdicion = null;  
  
  // Cargar datos al entrar, sirve para enviar datos 
  // del dashboard a cada usuario dependiendo su id y su usuario


import { verificar } from '../../backend/src/middleware/verificar.js';
// Cargar datos al entrar, sirve para enviar datos del dashboard a cada usuario dependiendo su id y su usuario
window.onload = async () => {
const usuario = await verificar();  // Llamamos la función verificar

  if (!usuario) {
    alert("No estás autenticado. Serás redirigido al login.");
    window.location.href = "./sesion.html";
    return;
  }

  // Mostrar bienvenida si el usuario está autenticado
  document.getElementById("bienvenida").innerText = `🔐 Bienvenido, ${usuario.nombre || usuario.usuario}`;

  // Cargar las entradas del usuario
  cargarEntradas();
};

async function cerrarSesion() {
  try {
    const res = await fetch("http://localhost:4000/api/auth/logout", {
      method: 'POST',
      credentials: 'include'
    });

    if (res.ok) {
      alert("🚪 Sesión cerrada correctamente");
      window.location.href = "./sesion.html";
    } else {
      alert("⚠️ No se pudo cerrar sesión");
    }
  } catch (error) {
    alert("⚠️ Error al cerrar sesión");
  }
}
window.cerrarSesion = cerrarSesion;


async function cargarEntradas() {
  console.log("📦 La función cargarEntradas() se ejecutó");

  try {
    // Hacer la solicitud para obtener las entradas
    const res = await fetch('http://localhost:4000/api/dashboard', {
      method: 'GET',
      credentials: 'include'
    });

    if (!res.ok) {
      console.error('Error en la solicitud:', res.statusText);
      return;
    }

    // Parsear la respuesta JSON
    const data = await res.json();
    console.log("Datos recibidos del servidor:", data); // Verifica que los datos estén llegando correctamente

    // Asegurarse de que `data.body.datos` sea un arreglo
    const entradas = data.body?.datos || [];
    console.log('Entradas:', entradas); // Verifica que `entradas` no esté vacío o mal formado
    
    const contenedor = document.getElementById('entradas');
    contenedor.innerHTML = '';  // Limpiar el contenido anterior

    if (entradas.length === 0) {
      // Si no hay entradas, mostramos un mensaje y mostramos el formulario
      contenedor.innerHTML = '<p>No has registrado ninguna información aún.</p>';
      document.getElementById('formDashboard').style.display = 'block';  // Mostrar el formulario
    } else {
      // Si hay entradas, las mostramos en el contenedor
      entradas.forEach(item => {
        // Formatear la fecha
        const fecha = new Date(item.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        // Crear el contenedor para cada entrada
        const div = document.createElement('div');
        div.classList.add('entrada');
        //Para mostrar las estrellas con base al raiting
        const rating = item.rating;
        let estrellasHTML = '<div class="estrellas">';
        for (let i = 5; i >= 1; i--) {
          estrellasHTML += `<span class="${i <= Math.round(rating) ? 'activa' : ''}">★</span>`;
        }
        estrellasHTML += '</div>'


          // Mostrar chips de detalle_nombres
        let detallesHTML = '';
        if (item.detalle_nombres && item.detalle_nombres.length > 0) {
          detallesHTML = `
            <p><strong>Servicios:</strong> ${item.detalle_nombres.map(nombre => `<span class="chip">${nombre}</span>`).join(' ')}</p>
          `;
        }




        
        div.innerHTML = `
        <h3>${item.nombre_negocio}</h3>
        <p><strong>Titular de la cuenta:</strong> ${item.nombre}</p>
        <p><strong>Encargado:</strong> ${item.nombre_encargado}</p>
        <p><strong>Descripción:</strong> ${item.descripcion}</p>
        <p><strong>Ubicación:</strong> ${item.ubicacion}</p>
        <p><strong>Horarios:</strong> ${item.horarios}</p>
        <p><strong>Envíos a domicilio:</strong> ${item.envios}</p>
        <p><strong>WhatsApp:</strong> ${item.whatsapp}</p>
        <p><strong>Información extra (Detalles):</strong> ${item.informacion_adicional}</p>
        <p><a href="${item.google_maps}" target="_blank">Link proporcionado por el cliente:</a></p>          




        <p>
        <a href="https://www.google.com/maps/dir/?api=1&destination=${item.latitud},${item.longitud}&travelmode=driving" target="_blank">
        La ruta para llegar a ti...
        </a>
        </p>

        <p><strong>Calificación:</strong> ${estrellasHTML} (${item.rating?.toFixed(1) || "2"})</p>


         <!-- Mostrar chips de detalle_nombres -->
        ${detallesHTML}

        <p><em>Publicado el: ${fechaFormateada}</em></p>
        <button onclick="editarEntrada(${item.id})">✏️ Editar</button>

       
    `;

        // Agregar la entrada al contenedor
        contenedor.appendChild(div);
      });

      // Ocultar el formulario si ya hay entradas
      document.getElementById('formDashboard').style.display = 'none';
    }
  } catch (error) {
    console.error('Error al cargar las entradas:', error);
    alert('Ocurrió un error al cargar las entradas. Revisa la consola para más detalles.');
  }
}

// Llamar la función cuando la página cargue
window.cargarEntradas = cargarEntradas;

//Para poder editar los datos---------------------------
window.editarEntrada = async function editarEntrada(id) {
  console.log('ID a editar:', id);
  idEdicion = id;

  try {
    const res = await fetch(`http://localhost:4000/api/dashboard`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!res.ok) {
      console.error('Error al obtener los datos:', res.statusText);
      return;
    }

    const data = await res.json();
    console.log('Datos obtenidos:', data);

    const entrada = data.body.datos.find(d => d.id === idEdicion);
    if (!entrada) {
      alert("Entrada no encontrada");
      return;
    }

    // Llenar el formulario con los datos de esa entrada
    document.getElementById('nombre').value = entrada.nombre;
    document.getElementById('descripcion').value = entrada.descripcion;
    document.getElementById('nombre_encargado').value = entrada.nombre_encargado;
    document.getElementById('nombre_negocio').value = entrada.nombre_negocio;
    document.getElementById('ubicacion_escrita').value = entrada.ubicacion;
    document.getElementById('horarios').value = entrada.horarios;
    document.getElementById('envios').value = entrada.envios;
    document.getElementById('whatsapp').value = entrada.whatsapp;
    document.getElementById('informacion_adicional').value = entrada.informacion_adicional;
    document.getElementById('google_maps').value = entrada.google_maps;
    document.getElementById('inputLatitud').value = entrada.latitud || '';
    document.getElementById('inputLongitud').value = entrada.longitud || '';

    modoEdicion = true;
    document.getElementById('formDashboard').style.display = 'block';
    document.getElementById('cancelarEdicion').style.display = 'inline-block';

    // 👉 Precargar selects usando la función que agregamos en Choices.js
    if (window.precargarSelects) {
      window.precargarSelects(entrada);
    }

  } catch (error) {
    console.error('Error al editar entrada:', error);
  }
}

// Botón cancelar edición
document.getElementById('cancelarEdicion').onclick = () => {
  modoEdicion = false;
  idEdicion = null;
  document.getElementById('formDashboard').reset();
  document.getElementById('formDashboard').style.display = 'none';
  document.getElementById('cancelarEdicion').style.display = 'none';
};
//------------------------------//

document.getElementById('formDashboard').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value;
  const descripcion = document.getElementById('descripcion').value;
  const nombre_encargado = document.getElementById('nombre_encargado').value;
  const nombre_negocio = document.getElementById('nombre_negocio').value;

  const localidad_id = parseInt(document.getElementById('localidad_id').value);
  const categoria_id = parseInt(document.getElementById('categoria_id').value);
  const subcategoria_id = parseInt(document.getElementById('subcategoria_id').value);
  // Choices.js: para detalle_ids múltiples
  const detalle_ids = Array.from(document.querySelectorAll('#detalle_ids option:checked'))
                         .map(opt => parseInt(opt.value));

                         console.log('detalle_ids:', detalle_ids);





  const ubicacion = document.getElementById('ubicacion_escrita').value;
  const horarios = document.getElementById('horarios').value;
  const envios = document.getElementById('envios').value;
  const whatsapp = document.getElementById('whatsapp').value;
  const informacion_adicional = document.getElementById('informacion_adicional').value;
  const google_maps = document.getElementById('google_maps').value;
  const latitud = document.getElementById('inputLatitud').value;
  const longitud = document.getElementById('inputLongitud').value;

  const datos = {
    nombre,
    descripcion,
    nombre_encargado,
    nombre_negocio,
    ubicacion,
    horarios,
    envios,
    whatsapp,
    informacion_adicional,
    google_maps,
    latitud,
    longitud,

    localidad_id,
    categoria_id,
    subcategoria_id,
    detalle_ids
  };

  try {
    if (modoEdicion && idEdicion) {
      // Modo edición: PUT
      const res = await fetch(`http://localhost:4000/api/dashboard/${idEdicion}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(datos)
      });

      const result = await res.json();
      document.getElementById('mensaje').innerText = result.body?.mensaje || 'Actualizado.' ;

      // Reset modo edición
      modoEdicion = false;
      idEdicion = null;
    } else {
      // Modo creación: POST
      const res = await fetch('http://localhost:4000/api/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(datos)
      });

      const result = await res.json();
      document.getElementById('mensaje').innerText = result.body?.mensaje || 'Guardado.';
    }

    e.target.reset();
    cargarEntradas();
  } catch (error) {
    document.getElementById('mensaje').innerText = '❌ Error al guardar.';
    console.error('Error al guardar entrada:', error);
  }
});

//PARA LA LAT Y LONG
window.addEventListener("message", function (event) {
  if (event.data.tipo === "ubicacion_guardada") {
    const { latitud, longitud } = event.data;

    // Establecer latitud y longitud en los campos ocultos
    document.getElementById('inputLatitud').value = latitud;
    document.getElementById('inputLongitud').value = longitud;

    // Mostrar un mensaje visual opcional
    document.getElementById('estadoUbicacion').textContent = '📍 Ubicación: Guardada ✅';
  }
});