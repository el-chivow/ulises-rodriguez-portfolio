import { verificar } from "../../backend/src/middleware/verificar.js";

let localidades = [];
let categorias = [];
let subcategorias = [];
let detalles = [];
let dummyData = [];

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Cargar todos los JSON en paralelo
    const [locData, catData, subcatData, detData, dataJson] = await Promise.all([
      fetch("./JS/filtroDataUno.json").then(res => res.json()),
      fetch("./JS/filtroDataDos.json").then(res => res.json()),
      fetch("./JS/filtroDataTres.json").then(res => res.json()),
      fetch("./JS/filtroDataCuatro.json").then(res => res.json()),

      //fetch("./JS/data.json").then(res => res.json()) 

      fetch("http://localhost:4000/api/dashboard/publicos") //En cuanto tenga todos los datos en mi base de datos
      //mientras va a jalar de data.json, es provisional 

      // TODAS LAS DIRECCIONES ESTÁN APUNTANDO A NIVEL LOCAL, EN PRODUCCION SOLO CAMBIAREMOS DIRECCION DEL SERVIDOR
      //PROPORCIONADO POR MI GESTOR DE SERVIDORES

      .then(res => res.json())
      .then(res => res.body.datos)    



    ]);
        
    localidades = locData;
    categorias = catData;
    subcategorias = subcatData;
    detalles = detData;


  dummyData = dataJson.map(item => ({
  id: item.negocio_id,
  localidad_id: item.localidad_id,
  categoria_id: item.categoria_id,
  subcategoria_id: item.subcategoria_id,
  detalle_ids: item.detalle_ids,
  
  detalle_nombres: item.detalle_nombres,

  descripcion: item.descripcion,

  



  nombre: item.nombre_encargado || item.nombre || '',   // nombre del dueño
  negocio: item.nombre_negocio || '',                   // nombre del negocio
  ubicacion_full: item.ubicacion || '',
  informacion_adicional: item.informacion_adicional || '',


  foto: item.imagen_perfil_url || "./img/noImagen.jpg", // Imagen de perfil pública
  foto_lugar: item.galeria_urls?.[0] || "./img/noImagen.jpg", // Primera imagen de galería si existe
  galeria: item.galeria_urls || [], // Todas las imágenes de galería para usar en un carrusel


  link_cliente: item.google_maps || '', //google_maps es así por el tema de que en la base de datos así se llama pero no tiene nada que ver con la ubicación
  whatsapp: item.whatsapp || '',
  horarios: item.horarios || '',
  envios_domicilio: item.envios || 'No',
  rating: item.rating || 2,

 link_google: (item.latitud && item.longitud)
  ? `https://www.google.com/maps/dir/?api=1&destination=${item.latitud},${item.longitud}&travelmode=driving`
  : null,

}));


    

    initFiltros();   // Inicializa los selects (filtros)
    initSearch();    // Inicializa la búsqueda y resultados

  } catch (error) {
    console.error("❌ Error al cargar los archivos JSON:", error);
  }
});


//Para despliegue del menu responisve
  const botonMenu = document.querySelector('.menu-icon');
  const menu = document.querySelector('.menu');
  // Mostrar/ocultar al hacer clic en el botón
  botonMenu.addEventListener('click', (e) => {
    e.stopPropagation(); // Evita que el clic se propague y lo cierre de inmediato
    menu.classList.toggle('show');
  });
  // Ocultar el menú si se hace clic fuera de él
  document.addEventListener('click', (e) => {
    if (menu.classList.contains('show') && !menu.contains(e.target)) {
      menu.classList.remove('show');
    }
  });
  // Prevenir que el clic dentro del menú lo cierre
  menu.addEventListener('click', (e) => {
    e.stopPropagation();
  });




// Función para inicializar los filtros
function initFiltros() {
  const ubicacionSelect = document.getElementById("ubicacion");
  const categoriaSelect = document.getElementById("categoria");
  const optionSelect = document.getElementById("opciones_especificas");
  const subtopicSelect = document.getElementById("subtemas_especificos");

  // Filtro 1 - Ubicación
  ubicacionSelect.innerHTML = '<option value="" disabled selected>Seleccione una ubicación</option>';
  ubicacionSelect.innerHTML += '<option value="todo">TODAS LAS OPCIONES EN EL MUNICIPIO</option>';
  localidades.forEach(loc => {
    const opt = document.createElement("option");
    // Aquí se usa loc.id (número); si quieres usar el nombre, puedes poner loc.nombre
    opt.value = loc.id;
    opt.textContent = loc.nombre;
    ubicacionSelect.appendChild(opt);
  });

  // Filtro 2 - Categoría
  categoriaSelect.innerHTML = '<option value="" disabled selected>Seleccione una opción</option>';
  categorias.forEach(cat => {
    const opt = document.createElement("option");
    // Usamos cat.id para trabajar con IDs numéricos
    opt.value = cat.id;
    opt.textContent = cat.nombre;
    categoriaSelect.appendChild(opt);
  });

  // Filtro 3 - Subcategorías
  categoriaSelect.addEventListener("change", function () {
    const categoriaId = parseInt(this.value);
    optionSelect.innerHTML = '<option value="" disabled selected>Seleccione una opción específica</option>';
    subtopicSelect.innerHTML = '<option value="" disabled selected>Seleccione un subtema específico</option>';

    const subcategoriasFiltradas = subcategorias.filter(sc => sc.categoria_id === categoriaId);
    subcategoriasFiltradas.forEach(option => {
      const opt = document.createElement("option");
      opt.value = option.id;
      opt.textContent = option.nombre;
      optionSelect.appendChild(opt);
    });
  });

  // Filtro 4 - Detalles
  optionSelect.addEventListener("change", function () {
    const subcategoriaId = parseInt(this.value);
    subtopicSelect.innerHTML = '<option value="" disabled selected>Seleccione un subtema específico</option>';

    const detallesFiltrados = detalles.filter(d => d.subcategoria_id === subcategoriaId);
    detallesFiltrados.forEach(sub => {
      const opt = document.createElement("option");
      opt.value = sub.id;
      opt.textContent = sub.nombre;
      subtopicSelect.appendChild(opt);
    });
  });
}

// Función para inicializar la búsqueda (Aqui se muestran los datos e inicia la busqueda que aparece abajo con las tarjetas
//que al darl clic abre el modal con todos los datos)
function initSearch() {
  const searchForm = document.getElementById("searchForm");
  const resultsContainer = document.getElementById("resultsContainer");
  const resultsSection = document.getElementById("results");
  const noResultsMessage = document.getElementById("noResultsMessage");

  if (searchForm) {
    searchForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Convertimos a número donde corresponde
      const categoria = parseInt(document.getElementById("categoria").value);
      const localidad = document.getElementById("ubicacion").value;
      const subcategoria = parseInt(document.getElementById("opciones_especificas").value);
      const detalle = parseInt(document.getElementById("subtemas_especificos").value);
      const searchTerm = document.getElementById("buscador").value.trim().toLowerCase();

      resultsContainer.innerHTML = "";
      noResultsMessage.style.display = "none";

      // Filtrado de dummyData usando IDs y búsqueda por texto
      const filteredData = dummyData.filter((item) => {
        const matchDetalle = isNaN(detalle) || (Array.isArray(item.detalle_ids) && item.detalle_ids.includes(detalle));
        const matchCategoria = isNaN(categoria) || item.categoria_id === categoria;
        const matchSubcategoria = isNaN(subcategoria) || item.subcategoria_id === subcategoria;
        const matchLocalidad = localidad === "todo" || item.localidad_id === parseInt(localidad);

        const matchTexto = !searchTerm || (
          (item.detalle_nombres || []).some(nombre => nombre.toLowerCase().includes(searchTerm)) ||
          (item.nombre_negocio || "").toLowerCase().includes(searchTerm) ||
          (item.descripcion || "").toLowerCase().includes(searchTerm)
        );

        return matchDetalle && matchCategoria && matchSubcategoria && matchLocalidad && matchTexto;
      });

      if (filteredData.length > 0) {
        filteredData.forEach((item) => {

          const card = document.createElement("div");
          card.classList.add("result-card");

          card.dataset.id = item.negocio_id; // ahora usamos negocio_id
          card.dataset.galeria = JSON.stringify(item.galeria || []);
          card.dataset.lugarFoto = item.foto_lugar || "No proporcinado";
          card.dataset.redSocial = item.link_cliente || "No proporcinado";
          card.dataset.ubicacionGoogle = item.link_google || "";
          card.dataset.elWhats = item.whatsapp || "";
          card.dataset.horarios = item.horarios || "";
          card.dataset.enviosDomicilio = item.envios_domicilio || "";
          card.dataset.informacionAdicional = item.informacion_adicional || "";
          card.dataset.rating = item.rating || 0;
          card.dataset.servicios = item.detalle_nombres || [];

          card.innerHTML = `
            <img src="${item.foto}" alt="${item.nombre}">
            <h3>${item.nombre}</h3>
            <p><strong>Negocio:</strong> ${item.negocio}</p>
            <h6>${item.ubicacion_full}</h6>
          `;

          resultsContainer.appendChild(card);

        });
        resultsSection.style.display = "block";
      } else {
        noResultsMessage.style.display = "block";
        resultsSection.style.display = "block";
      }

      resultsSection.scrollIntoView({ behavior: "smooth" });
    });
  }






  // Modal y sus eventos
  const modal = document.getElementById("modal");
  const modalContent = document.querySelector(".modal-content");
  const modalInfo = document.getElementById("modalInfo");
  const closeModal = document.getElementById("closeModal");

  const openModal = () => {
    modal.style.display = "flex";
    document.body.classList.add("modal-open");  
  };

  

  const closeModalFunction = () => {
    modal.style.display = "none";
    document.body.classList.remove("modal-open");
  };

  if (modal && closeModal) {
    modal.style.display = "none"; // Asegura que el modal esté oculto al cargar

    modal.addEventListener("click", (e) => {
      if (!modalContent.contains(e.target)) {
        closeModalFunction();
      }
    });

    closeModal.addEventListener("click", closeModalFunction);
  }

  document.addEventListener("click", function (e) {
    if (e.target.id === "whatsappBtn") {
      const phoneNumber = e.target.getAttribute("data-whatsapp");
      if (phoneNumber && phoneNumber.trim()) {
        const whatsappURL = `https://wa.me/${phoneNumber.trim()}`;
        window.open(whatsappURL, "_blank");
      } else {
        alert("Número de WhatsApp no disponible.");
      }
    }
  });
  //A partir de aqui lo que va en el modal principal, el que todos ven y usar verficar para que los iniciados sesion puedan ver
resultsContainer.addEventListener("click", (e) => {
  if (e.target.closest(".result-card")) {
    const card = e.target.closest(".result-card");

    modalInfo.innerHTML = '';

    const name = card.querySelector("h3").textContent || "Nombre no proporcionado";
    const businessElement = card.querySelector("p strong");
    const business = businessElement ? businessElement.nextSibling.nodeValue.trim() : "Información no disponible";
    const location = card.querySelector("h6")?.textContent.trim() || "Ubicación no disponible";
    const horarios = card.dataset.horarios || "Horarios no disponibles";
    const enviosDomicilio = card.dataset.enviosDomicilio || "Información no disponible";
    const informacionAdicional = card.dataset.informacionAdicional || "Información adicional no disponible";
    const rating = parseInt(card.dataset.rating) || 0;
    const negocioId = card.dataset.id; 
    const galeria = JSON.parse(card.dataset.galeria || "[]");
    const ubicacionGoogle = card.dataset.ubicacionGoogle || null;
    const whatsapp = card.dataset.elWhats || "No disponible";

    
    const serviciosOfrecidos = card.dataset.servicios || "No disponible";

    let redSocial= card.dataset.redSocial || ""; 
    if (redSocial && !/^https?:\/\//i.test(redSocial)) {
      redSocial = "https://" + redSocial;
    }
    

    // HTML sin lugarFoto
    const infoHTML = `
      <p><strong>Encargado:</strong> ${name}</p>
      <p><strong>Negocio:</strong> ${business}</p>
      <p><strong>Ubicación:</strong> ${location}</p>
      <p><strong>Horarios:</strong> ${horarios}</p>
      <p><strong>Envíos a Domicilio:</strong> ${enviosDomicilio}</p>

      <p><strong>Servicios que ofrece: </strong> 
        ${serviciosOfrecidos
            .split(',')
            .map(s => s.trim().toLowerCase())
            .map(s => s.charAt(0).toUpperCase() + s.slice(1))
            .join(', ')}
      </p>

      

      <p><strong>WhatsApp o llamada:</strong> ${whatsapp}</p>
      <button class="buttonwhats" id="whatsappBtn" data-whatsapp="${whatsapp}">
        Contactar por WhatsApp
      </button>
      <p><strong>Información adicional:</strong> ${informacionAdicional}</p>
    
    <p><strong>Ubicación en Google Maps:</strong> 
  ${
    ubicacionGoogle
      ? `<a href="${ubicacionGoogle}" target="_blank" rel="noopener noreferrer" style="color: #007bff;">
           Ver en Google Maps
         </a>`
      : `<span style="color: red;">Ubicación no disponible</span>`
  }
</p>


      <p><strong>Facebook o instagram: </strong>
        <a href="${redSocial}" target="_blank" rel="noopener noreferrer" style="color: #007bff;">
          Link directo
        </a>
      </p>
      <div class="stars" data-rating="${rating}">
        <p><strong>Calificación:</strong></p>
        <span class="star" data-value="1">★</span>
        <span class="star" data-value="2">★</span>
        <span class="star" data-value="3">★</span>
        <span class="star" data-value="4">★</span>
        <span class="star" data-value="5">★</span>
      </div>
    `;



    modalInfo.insertAdjacentHTML('beforeend', infoHTML);

    // Estrellas----------------------------------------------------------------------------------
    const stars = modalInfo.querySelectorAll(".star");
    stars.forEach((star) => {
      const value = parseInt(star.getAttribute("data-value"));
      if (value <= rating) {
        star.classList.add("filled");
      }



      star.addEventListener("click", async function () {
  const autenticado = await verificar();

  if (!autenticado) {
    alert("Debes iniciar sesión para calificar.");
    return;
  }

  const calificacion = parseInt(star.getAttribute("data-value"));



  if (confirm(`¿Estás seguro de calificar con ${calificacion} estrellas?`)) {

        fetch(`http://localhost:4000/api/dashboard/calificar/${negocioId}`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ negocioId, calificacion }),
        })
        .then(response => {
          console.log("➡️ Respuesta cruda del servidor:", response);
          // Validar tipo de respuesta antes de convertir a JSON
          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            throw new Error("❌ La respuesta no es JSON válido.");
          }
          return response.json();
        })
        .then(data => {
          console.log("✅ JSON recibido:", data);
          if (data.ok) {
            alert("Calificado con éxito");
            actualizarRatingEnFrontend(data.rating);
          } else {
            alert(data.mensaje || "Hubo un problema al calificar.");
          }
        })
        .catch(error => {
          console.error("❌ Error al calificar:", error);
          alert("Error al calificar.");
        });


  }
});
      
    });

    function actualizarRatingEnFrontend(nuevoRating) {
      const stars = modalInfo.querySelectorAll(".star");
      stars.forEach(star => {
        const value = parseInt(star.getAttribute("data-value"));
        star.classList.toggle("filled", value <= nuevoRating);
      });
    }

    // Obtener calificación actual
async function obtenerCalificacionSiAutenticado(negocioId) {
  const autenticado = await verificar();
  if (autenticado) {
      const rating = parseFloat(card.dataset.rating);
      actualizarRatingEnFrontend(rating);
  }
}

if (negocioId) {
  obtenerCalificacionSiAutenticado(negocioId);
}

//Aqui acaba lo de la calificacion------------------------------------------------------

    // 📸 Galería simple
    if (galeria.length > 0) {
      const galeriaTitulo = document.createElement("p");
      galeriaTitulo.style.marginTop = "20px";
      galeriaTitulo.innerHTML = "<strong>Galería:</strong>";
      modalInfo.appendChild(galeriaTitulo);

      const galeriaWrapper = document.createElement("div");
      galeriaWrapper.className = "galeria-wrapper";

      const galeriaContainer = document.createElement("div");
      galeriaContainer.className = "galeria-container";

      galeria.forEach((imgUrl) => {
        const img = document.createElement("img");
        img.src = imgUrl;
        img.alt = "Foto del lugar";
        img.className = "galeria-img";
        galeriaContainer.appendChild(img);
      });

      const btnPrev = document.createElement("button");
      btnPrev.className = "galeria-prev";
      btnPrev.textContent = "←";

      const btnNext = document.createElement("button");
      btnNext.className = "galeria-next";
      btnNext.textContent = "→";

      galeriaWrapper.appendChild(btnPrev);
      galeriaWrapper.appendChild(galeriaContainer);
      galeriaWrapper.appendChild(btnNext);
      modalInfo.appendChild(galeriaWrapper);

      let currentIndex = 0;
      const imagenes = galeriaContainer.querySelectorAll(".galeria-img");

      function mostrarImagen(index) {
        imagenes.forEach((img, i) => {
          img.style.display = i === index ? "block" : "none";
        });
      }

      btnPrev.addEventListener("click", () => {
        currentIndex = (currentIndex - 1 + imagenes.length) % imagenes.length;
        mostrarImagen(currentIndex);
      });

      btnNext.addEventListener("click", () => {
        currentIndex = (currentIndex + 1) % imagenes.length;
        mostrarImagen(currentIndex);
      });

      mostrarImagen(currentIndex);
    }

    // Abrimos el modal al final
    openModal();
  }
});


}

// Esperar a que toda la página esté cargada
window.addEventListener('load', () => {
  const navBg = document.querySelector('.nav-bg');
  if (navBg) {
    navBg.scrollIntoView({ behavior: 'smooth' }); // Desplazamiento suave
  }
});

