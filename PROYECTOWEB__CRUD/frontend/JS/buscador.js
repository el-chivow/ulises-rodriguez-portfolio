window.addEventListener('DOMContentLoaded', async () => {
    let filtroDataDos = [];
    let filtroDataTres = [];
    let filtroDataCuatro = [];
  
    const buscador = document.getElementById('buscador');
    const contenedor = document.getElementById('contenedor-buscador');
    const categoriaSelect = document.getElementById('categoria');
    //const ubicacionSelect = document.getElementById('ubicacion');
    const opcionesEspecificasSelect = document.getElementById('opciones_especificas');
    const subtemasEspecificosSelect = document.getElementById('subtemas_especificos');
    
    try {
      const [categorias, subcategorias, detalles] = await Promise.all([
        fetch('./JS/filtroDataDos.json').then(res => res.json()),
        fetch('./JS/filtroDataTres.json').then(res => res.json()),
        fetch('./JS/filtroDataCuatro.json').then(res => res.json())
      ]);
  
      filtroDataDos = categorias;
      filtroDataTres = subcategorias;
      filtroDataCuatro = detalles;
  
      llenarSelectCategorias();
      inicializarListeners();
      activarBuscador();

       // 👇 Este bloque es el nuevo código que cierra la lista al hacer clic afuera
    document.addEventListener('click', function(event) {
      const dentroDelContenedor = contenedor.contains(event.target);
      const esBuscador = buscador.contains(event.target);

      if (!dentroDelContenedor && !esBuscador) {
        contenedor.classList.remove('mostrar');
        contenedor.innerHTML = '';
      }
    });



    } catch (error) {
      console.error('Error al cargar los archivos JSON:', error);
    }


    function limpiarTexto(str) {
    return (str || '')
    .normalize('NFD')              // Descompone letras y acentos para el buscador
    .replace(/[\u0300-\u036f]/g, '') // Elimina los diacríticos
    .toLowerCase();
    }


function buscarEnTodo(texto) {
  const palabras = limpiarTexto(texto).split(/\s+/).filter(p => p.length > 0);
  if (palabras.length === 0) return [];

  let negociosCoinciden = filtroDataCuatro.filter(negocio => {
    const subcategoria = filtroDataTres.find(s => s.id === negocio.subcategoria_id) || {};
    const categoria = filtroDataDos.find(c => c.id === subcategoria.categoria_id) || {};

    const textoBusqueda = limpiarTexto([
      negocio.nombre,
      negocio.descripcion,
      negocio.ubicacion,
      categoria.nombre,
      subcategoria.nombre
    ].join(' '));

    return palabras.some(p => textoBusqueda.includes(p));
  });

  const categoriasCoinciden = filtroDataDos.filter(categoria =>
    palabras.some(p => limpiarTexto(categoria.nombre).includes(p))
  );

  const subcategoriasCoinciden = filtroDataTres.filter(subcategoria =>
    palabras.some(p => limpiarTexto(subcategoria.nombre).includes(p))
  );

  categoriasCoinciden.forEach(cat => {
    const subcats = filtroDataTres.filter(s => s.categoria_id === cat.id).map(s => s.id);
    const negociosDeCat = filtroDataCuatro.filter(n => subcats.includes(n.subcategoria_id));
    negociosCoinciden = [...negociosCoinciden, ...negociosDeCat];
  });

  subcategoriasCoinciden.forEach(subcat => {
    const negociosDeSub = filtroDataCuatro.filter(n => n.subcategoria_id === subcat.id);
    negociosCoinciden = [...negociosCoinciden, ...negociosDeSub];
  });

  const mapa = new Map();
  negociosCoinciden.forEach(n => mapa.set(n.id, n));

  return Array.from(mapa.values());
}
  
    function llenarSelectCategorias() {
      categoriaSelect.innerHTML = '<option value="">Selecciona una categoría</option>';
      filtroDataDos.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.nombre;
        categoriaSelect.appendChild(option);
      });
    }
  
    function inicializarListeners() {
      categoriaSelect.addEventListener('change', () => {
        llenarOpcionesEspecificas(categoriaSelect.value);
        subtemasEspecificosSelect.innerHTML = '<option value="">Selecciona un subtema</option>';
      });
  
      opcionesEspecificasSelect.addEventListener('change', () => {
        llenarSubtemas(opcionesEspecificasSelect.value);
      });
    }
  
 function activarBuscador() {
  buscador.addEventListener('input', () => {
    const texto = buscador.value.trim();
    if (!texto) {
      contenedor.innerHTML = '';
      contenedor.classList.remove('mostrar');
      return;
    }

    // Ahora busca en todo
    const resultados = buscarEnTodo(texto);

    // Sigues usando tu render actual
    mostrarResultados(resultados);
  });
}
    


    //esta funcion es el de la busqueda rápida
    function mostrarResultados(resultados) {
  contenedor.innerHTML = '';
  contenedor.classList.add('mostrar');

  if (resultados.length === 0) {
    const mensaje = document.createElement('p');
    mensaje.textContent = 'No hay coincidencias';
    mensaje.style.color = 'red';
    mensaje.style.fontSize = '18px';
    mensaje.style.fontWeight = 'bold';
    contenedor.appendChild(mensaje);
    return;
  }

  resultados.forEach(negocio => {
    const subcategoria = filtroDataTres.find(s => s.id === negocio.subcategoria_id);
    const categoria = subcategoria ? filtroDataDos.find(c => c.id === subcategoria.categoria_id) : null;

    const div = document.createElement('div');
    div.classList.add('resultado-busqueda');

    div.innerHTML = `
      <div class="resultado-contenido">
        <div class="imagen-negocio">
          <img src="${negocio.imagen || './img/placeholder.jpg'}" alt="${negocio.nombre}" />
        </div>
        <div class="info-negocio">
          <p class="nombre-negocio" data-id="${negocio.id}">
            ${negocio.nombre}
          </p>
          <p class="descripcion-negocio">${negocio.descripcion || 'Sin descripción disponible'}</p>
          <p class="extra-info">
            ${categoria ? `<small>📂 ${categoria.nombre}</small>` : ''}
            ${subcategoria ? `<small> • 📑 ${subcategoria.nombre}</small>` : ''}
          </p>
        </div>
      </div>
    `;

    contenedor.appendChild(div);

    div.addEventListener('click', () => {
      llenarFiltros(negocio);
      buscador.value = negocio.nombre;
      contenedor.innerHTML = '';
      contenedor.classList.remove('mostrar');
      const botonBuscar = document.getElementById('bo-buscar');
      if (botonBuscar) botonBuscar.click();
    });
  });
}
  
    function llenarFiltros(negocio) {
      const subcategoria = filtroDataTres.find(item => item.id === negocio.subcategoria_id);
      if (!subcategoria) return;
    
      const categoriaId = subcategoria.categoria_id;
      categoriaSelect.value = categoriaId;
    
      llenarOpcionesEspecificas(categoriaId, negocio.subcategoria_id);
    
      const detalleNombre = negocio.nombre; 
      llenarSubtemas(negocio.subcategoria_id, detalleNombre);
    }
  
    function llenarOpcionesEspecificas(categoriaId, seleccionarId = null) {
      opcionesEspecificasSelect.innerHTML = '<option value="">Selecciona una opción</option>';
      const subcategorias = filtroDataTres.filter(item => item.categoria_id == categoriaId);
  
      subcategorias.forEach(subcat => {
        const option = document.createElement('option');
        option.value = subcat.id;
        option.textContent = subcat.nombre;
        opcionesEspecificasSelect.appendChild(option);
      });
  
      if (seleccionarId) {
        opcionesEspecificasSelect.value = seleccionarId;
      }
    }
  
    function llenarSubtemas(subcategoriaId, seleccionarDetalleNombre = null) {
      subtemasEspecificosSelect.innerHTML = '<option value="">Selecciona un subtema</option>';
    
      const negociosConSubcategoria = filtroDataCuatro.filter(item => item.subcategoria_id == subcategoriaId);
      const nombresUnicos = new Set();
    
      negociosConSubcategoria.forEach(item => {
        if (!nombresUnicos.has(item.nombre)) {
          nombresUnicos.add(item.nombre);
          const option = document.createElement('option');
          option.value = item.nombre;  // Usamos el nombre directamente
          option.textContent = item.nombre;
          subtemasEspecificosSelect.appendChild(option);
        }
      });
    
      // Ahora comparas con nombre, no con ID.
      if (seleccionarDetalleNombre) {
        subtemasEspecificosSelect.value = seleccionarDetalleNombre;
      }
    }

    
  });