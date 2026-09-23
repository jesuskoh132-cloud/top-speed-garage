/* =============================================================
   TALLERCLICK - LÓGICA DEL COTIZADOR

   Este archivo está dividido en secciones numeradas.
   Te recomiendo leer primero los nombres de las funciones y después
   entrar a los detalles de cada una.
   ============================================================= */

/* =============================================================
   1. CONFIGURACIÓN DEL COTIZADOR

   Aquí puedes cambiar valores importantes sin buscar en todo el código.
   ============================================================= */

/*
  Escribe el número con lada del país, sin +, espacios ni guiones.
  Ejemplo: "529981234567".

  Si lo dejas vacío, WhatsApp permitirá elegir el contacto manualmente.
*/
const NUMERO_WHATSAPP_DEL_TALLER = "529987331141";

/* Nombre que se mostrará en el resumen y en WhatsApp. */
const NOMBRE_POR_TIPO_DE_VEHICULO = {
  compacto: "Compacto / Sedán",
  suv: "SUV",
  pickup: "Pickup",
  van: "Van"
};

/* Nombre utilizado para guardar el borrador dentro del navegador. */
const CLAVE_BORRADOR = "tallerclick-borrador-solicitud-v2";

/* =============================================================
   2. ELEMENTOS DEL HTML QUE UTILIZARÁ JAVASCRIPT

   document.querySelector busca un elemento dentro del HTML.
   El símbolo # significa que estamos buscando por su id.
   ============================================================= */
const formularioCotizacion = document.querySelector("#formulario-cotizacion");
const selectorMarcaVehiculo = document.querySelector("#marca-vehiculo");
const entradaModeloVehiculo = document.querySelector("#modelo-vehiculo");
const selectorAnioVehiculo = document.querySelector("#anio-vehiculo");
const selectorTipoVehiculo = document.querySelector("#tipo-vehiculo");
const entradaNombreCliente = document.querySelector("#nombre-cliente");
const entradaFechaCita = document.querySelector("#fecha-cita");
const entradaOtroSintoma = document.querySelector("#otro-sintoma");

/*
  querySelectorAll obtiene varios elementos.
  Los corchetes [...] convierten el resultado en un arreglo normal.
*/
const casillasDeServicios = [
  ...document.querySelectorAll(".casilla-servicio")
];

const botonesDeSintomas = [
  ...document.querySelectorAll(".boton-sintoma")
];

const textoNombreVehiculo = document.querySelector("#nombre-vehiculo-resumen");
const textoDetallesVehiculo = document.querySelector("#detalles-vehiculo-resumen");
const textoEstadoCotizacion = document.querySelector("#estado-cotizacion");
const listaServiciosSeleccionados = document.querySelector("#lista-servicios-seleccionados");
const mensajeSinServicios = document.querySelector("#mensaje-sin-servicios");
const textoFechaCita = document.querySelector("#fecha-cita-resumen");
const botonEnviarWhatsApp = document.querySelector("#boton-enviar-whatsapp");
const notificacionUsuario = document.querySelector("#notificacion-usuario");

/* Guardará el temporizador utilizado para ocultar la notificación. */
let temporizadorDeNotificacion;

/* =============================================================
   3. PREPARACIÓN INICIAL DE LOS CAMPOS
   ============================================================= */

/**
 * Agrega al selector los años disponibles.
 * Comienza con el próximo año y termina en 1995.
 */
function llenarSelectorDeAnios() {
  const anioActual = new Date().getFullYear();

  for (let anio = anioActual + 1; anio >= 1995; anio -= 1) {
    const nuevaOpcion = document.createElement("option");
    nuevaOpcion.value = String(anio);
    nuevaOpcion.textContent = String(anio);
    selectorAnioVehiculo.append(nuevaOpcion);
  }
}

/**
 * Evita que el usuario seleccione una fecha anterior al día actual.
 */
function establecerFechaMinima() {
  const fechaActual = new Date().toISOString().split("T")[0];
  entradaFechaCita.min = fechaActual;
}

/* =============================================================
   4. FUNCIONES QUE LEEN LO SELECCIONADO POR EL USUARIO
   ============================================================= */

/**
 * Devuelve un arreglo con los servicios marcados.
 *
 * Ejemplo del resultado:
 * [{ identificador: "escaner-profesional", nombre: "Escáner profesional" }]
 */
function obtenerServiciosSeleccionados() {
  return casillasDeServicios
    .filter((casilla) => casilla.checked)
    .map((casilla) => ({
      identificador: casilla.value,
      nombre: casilla.dataset.nombre
    }));
}

/**
 * Devuelve un arreglo con los textos de los síntomas seleccionados.
 */
function obtenerSintomasSeleccionados() {
  const sintomas = botonesDeSintomas
    .filter((boton) => boton.getAttribute("aria-pressed") === "true")
    .map((boton) => boton.textContent.trim());

  const otroSintoma = entradaOtroSintoma.value.trim();

  if (otroSintoma) {
    sintomas.push(`Otro: ${otroSintoma}`);
  }

  return sintomas;
}

/**
 * Reúne todos los valores actuales del formulario en un solo objeto.
 * Esto evita leer cada campo repetidamente en otras funciones.
 */
function obtenerDatosDelFormulario() {
  return {
    marca: selectorMarcaVehiculo.value,
    modelo: entradaModeloVehiculo.value.trim(),
    anio: selectorAnioVehiculo.value,
    tipoVehiculo: selectorTipoVehiculo.value,
    nombreCliente: entradaNombreCliente.value.trim(),
    fechaCita: entradaFechaCita.value,
    servicios: obtenerServiciosSeleccionados(),
    sintomas: obtenerSintomasSeleccionados()
  };
}

/**
 * Convierte "2026-10-08" en un texto más fácil de leer.
 */
function convertirFechaATexto(fecha) {
  if (!fecha) {
    return "Por definir";
  }

  const fechaPreparada = new Date(`${fecha}T12:00:00Z`);

  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(fechaPreparada);
}

/* =============================================================
   6. ACTUALIZACIÓN DEL RESUMEN VISIBLE
   ============================================================= */

/**
 * Actualiza el nombre y los detalles del vehículo en el resumen.
 */
function actualizarVehiculoDelResumen(datosFormulario) {
  const escribioAlgunDato =
    datosFormulario.marca || datosFormulario.modelo || datosFormulario.anio;

  if (escribioAlgunDato) {
    textoNombreVehiculo.textContent = [
      datosFormulario.marca,
      datosFormulario.modelo
    ]
      .filter(Boolean)
      .join(" ");
  } else {
    textoNombreVehiculo.textContent = "Agrega tu vehículo";
    textoDetallesVehiculo.textContent = "Marca, modelo y año";
    return;
  }

  const nombreTipoVehiculo =
    NOMBRE_POR_TIPO_DE_VEHICULO[datosFormulario.tipoVehiculo];

  textoDetallesVehiculo.textContent = [
    datosFormulario.anio,
    nombreTipoVehiculo
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * Borra la lista anterior y crea una fila nueva por cada servicio.
 */
function actualizarListaDeServicios(datosFormulario) {
  listaServiciosSeleccionados.replaceChildren();

  datosFormulario.servicios.forEach((servicio) => {
    const filaServicio = document.createElement("li");
    const nombreServicio = document.createElement("span");
    const estadoServicio = document.createElement("span");

    nombreServicio.textContent = servicio.nombre;
    estadoServicio.textContent = "Seleccionado";

    filaServicio.append(nombreServicio, estadoServicio);
    listaServiciosSeleccionados.append(filaServicio);
  });

  /* El mensaje solo aparece cuando no hay servicios seleccionados. */
  mensajeSinServicios.hidden = datosFormulario.servicios.length > 0;
}

/**
 * Muestra si la solicitud ya tiene al menos un servicio seleccionado.
 * No calcula precios porque cada vehículo necesita una revisión distinta.
 */
function actualizarEstadoDeCotizacion(datosFormulario) {
  if (datosFormulario.servicios.length === 0) {
    textoEstadoCotizacion.textContent = "Selecciona un servicio";
    return;
  }

  textoEstadoCotizacion.textContent = "Cotización personalizada";
}

/**
 * Actualiza la fecha del resumen y habilita o deshabilita WhatsApp.
 */
function actualizarFechaYBoton(datosFormulario) {
  textoFechaCita.textContent = convertirFechaATexto(
    datosFormulario.fechaCita
  );

  botonEnviarWhatsApp.disabled = datosFormulario.servicios.length === 0;
}

/**
 * Esta es la función central de la interfaz.
 * Se ejecuta cada vez que el usuario cambia un campo.
 */
function actualizarResumenVisual() {
  const datosFormulario = obtenerDatosDelFormulario();

  actualizarVehiculoDelResumen(datosFormulario);
  actualizarListaDeServicios(datosFormulario);
  actualizarEstadoDeCotizacion(datosFormulario);
  actualizarFechaYBoton(datosFormulario);
  guardarBorrador(datosFormulario);
}

/* =============================================================
   7. GUARDAR Y RECUPERAR EL BORRADOR

   localStorage permite conservar los datos en este navegador.
   No se envían a una base de datos.
   ============================================================= */

/**
 * Guarda únicamente datos simples que luego podamos restaurar.
 */
function guardarBorrador(datosFormulario) {
  const borrador = {
    otroSintoma: entradaOtroSintoma.value.trim(),
    marca: datosFormulario.marca,
    modelo: datosFormulario.modelo,
    anio: datosFormulario.anio,
    tipoVehiculo: datosFormulario.tipoVehiculo,
    nombreCliente: datosFormulario.nombreCliente,
    fechaCita: datosFormulario.fechaCita,
    identificadoresServicios: datosFormulario.servicios.map(
      (servicio) => servicio.identificador
    ),
    sintomas: datosFormulario.sintomas
  };

  try {
    localStorage.setItem(CLAVE_BORRADOR, JSON.stringify(borrador));
  } catch (error) {
    /* La página puede seguir funcionando aunque el navegador no permita guardar. */
    console.warn("No se pudo guardar el borrador.", error);
  }
}

/**
 * Coloca nuevamente en el formulario los datos guardados anteriormente.
 */
function restaurarBorrador() {
  try {
    const textoGuardado = localStorage.getItem(CLAVE_BORRADOR);

    if (!textoGuardado) {
      return;
    }

    const borrador = JSON.parse(textoGuardado);

    entradaOtroSintoma.value = borrador.otroSintoma || "";

    selectorMarcaVehiculo.value = borrador.marca || "";
    entradaModeloVehiculo.value = borrador.modelo || "";
    selectorAnioVehiculo.value = borrador.anio || "";
    selectorTipoVehiculo.value = borrador.tipoVehiculo || "compacto";
    entradaNombreCliente.value = borrador.nombreCliente || "";

    /* No restauramos una fecha que ya quedó en el pasado. */
    entradaFechaCita.value =
      borrador.fechaCita && borrador.fechaCita >= entradaFechaCita.min
        ? borrador.fechaCita
        : "";

    casillasDeServicios.forEach((casilla) => {
      casilla.checked = (borrador.identificadoresServicios || []).includes(
        casilla.value
      );
    });

    botonesDeSintomas.forEach((boton) => {
      const estaSeleccionado = (borrador.sintomas || []).includes(
        boton.textContent.trim()
      );

      boton.setAttribute("aria-pressed", String(estaSeleccionado));
    });
  } catch (error) {
    console.warn("No se pudo recuperar el borrador.", error);
  }
}

/* =============================================================
   8. MENSAJE Y ENVÍO A WHATSAPP
   ============================================================= */

/**
 * Busca el primer campo obligatorio que todavía está vacío.
 * Si todos están llenos, devuelve null.
 */
function buscarPrimerCampoObligatorioVacio() {
  const camposObligatorios = [
    selectorMarcaVehiculo,
    entradaModeloVehiculo,
    selectorAnioVehiculo
  ];

  return camposObligatorios.find((campo) => !campo.value.trim()) || null;
}

/**
 * Crea el texto completo que recibirá el taller por WhatsApp.
 */
function crearMensajeParaWhatsApp(datosFormulario) {
  const nombreVehiculo = [
    datosFormulario.marca,
    datosFormulario.modelo,
    datosFormulario.anio
  ]
    .filter(Boolean)
    .join(" ");

  const nombresServicios = datosFormulario.servicios
    .map((servicio) => servicio.nombre)
    .join(", ");

  const textoSintomas = datosFormulario.sintomas.length > 0
    ? datosFormulario.sintomas.join(", ")
    : "Ninguno indicado";

  /* Cada elemento del arreglo será una línea del mensaje. */
  const lineasDelMensaje = [
    "Hola, quiero solicitar una cotización.",
    "",
    `Nombre: ${datosFormulario.nombreCliente || ""}`,
    `Vehículo: ${nombreVehiculo}`,
    `Tipo: ${NOMBRE_POR_TIPO_DE_VEHICULO[datosFormulario.tipoVehiculo]}`,
    `Servicios: ${nombresServicios}`,
    `Síntomas: ${textoSintomas}`,
    `Fecha preferida: ${convertirFechaATexto(datosFormulario.fechaCita)}`,
    "",
    "Solicito una revisión y una cotización personalizada.",
    "Entiendo que el precio se confirma después de revisar el vehículo."
  ];

  return lineasDelMensaje.join("\n");
}

/**
 * Valida los campos y abre WhatsApp con el mensaje preparado.
 */
function enviarSolicitudPorWhatsApp() {
  const campoVacio = buscarPrimerCampoObligatorioVacio();

  if (campoVacio) {
    mostrarNotificacion(
      "Completa marca, modelo y año antes de enviar."
    );

    campoVacio.focus();
    return;
  }

  const datosFormulario = obtenerDatosDelFormulario();

  if (datosFormulario.servicios.length === 0) {
    mostrarNotificacion("Selecciona al menos un servicio.");
    return;
  }

  const mensaje = crearMensajeParaWhatsApp(datosFormulario);
  const mensajeCodificado = encodeURIComponent(mensaje);

  let enlaceWhatsApp;

  if (NUMERO_WHATSAPP_DEL_TALLER) {
    enlaceWhatsApp =
      `https://wa.me/${9987331141}?text=${mensajeCodificado}`;
  } else {
    enlaceWhatsApp =
      `https://api.whatsapp.com/send?text=${mensajeCodificado}`;
  }

  window.open(enlaceWhatsApp, "_blank", "noopener,noreferrer");
}

/* =============================================================
   9. INTERACCIONES Y NOTIFICACIONES
   ============================================================= */

/**
 * Cambia un síntoma de no seleccionado a seleccionado y viceversa.
 */
function cambiarSeleccionDeSintoma(botonSintoma) {
  const estabaSeleccionado =
    botonSintoma.getAttribute("aria-pressed") === "true";

  botonSintoma.setAttribute(
    "aria-pressed",
    String(!estabaSeleccionado)
  );

  actualizarResumenVisual();
}

/**
 * Muestra un pequeño mensaje en la parte inferior durante 2.6 segundos.
 */
function mostrarNotificacion(mensaje) {
  notificacionUsuario.textContent = mensaje;
  notificacionUsuario.classList.add("notificacion--visible");

  clearTimeout(temporizadorDeNotificacion);

  temporizadorDeNotificacion = setTimeout(() => {
    notificacionUsuario.classList.remove("notificacion--visible");
  }, 2600);
}

/**
 * Conecta los elementos del HTML con las funciones de JavaScript.
 */
function registrarEventosDelCotizador() {
  /* Detecta cuando el usuario escribe su nombre o el modelo del auto. */
  formularioCotizacion.addEventListener("input", (evento) => {
    const escribioEnCampoDeTexto =
     evento.target.matches('input[type="text"], textarea');
    if (escribioEnCampoDeTexto) {
      actualizarResumenVisual();
    }
  });

  /* Detecta cambios en selectores, fechas y casillas de servicios. */
  formularioCotizacion.addEventListener("change", actualizarResumenVisual);

  botonesDeSintomas.forEach((botonSintoma) => {
    botonSintoma.addEventListener("click", () => {
      cambiarSeleccionDeSintoma(botonSintoma);
    });
  });

  botonEnviarWhatsApp.addEventListener(
    "click",
    enviarSolicitudPorWhatsApp
  );
}

/* =============================================================
   10. INICIO DE LA APLICACIÓN
   ============================================================= */

/**
 * Ejecuta en orden todo lo necesario para comenzar.
 */
function iniciarCotizador() {
  llenarSelectorDeAnios();
  establecerFechaMinima();
  restaurarBorrador();
  registrarEventosDelCotizador();
  actualizarResumenVisual();
}

/*
  DOMContentLoaded ocurre cuando el navegador terminó de crear el HTML.
  En ese momento ya podemos buscar y modificar sus elementos.
*/
document.addEventListener("DOMContentLoaded", iniciarCotizador);

/* =============================================================
   11. NAVEGACIÓN ENTRE LA INFORMACIÓN Y EL COTIZADOR

   La página comienza mostrando la información del taller.
   El cotizador se abre solamente cuando el visitante presiona
   uno de los botones "Solicitar cotización".
   ============================================================= */

/* Guardamos las dos partes principales de la página. */
const paginaCotizador = document.querySelector("#pagina-cotizador");
const paginaInformacionTaller = document.querySelector(
  "#pagina-informacion-taller"
);

/* Estos títulos recibirán el enfoque al cambiar de apartado. */
const tituloCotizador = document.querySelector("#titulo-pagina");
const tituloInformacionTaller = document.querySelector(
  "#titulo-informacion-taller"
);

/* Botón para regresar y botón general ubicado junto a la dirección. */
const botonVolverAInformacion = document.querySelector(
  "#boton-volver-informacion-desde-cotizador"
);
const botonAbrirCotizadorGeneral = document.querySelector(
  "#boton-cotizar-desde-informacion"
);

/* Obtenemos todos los botones de las tarjetas de servicios. */
const botonesCotizarProducto = [
  ...document.querySelectorAll(".boton-cotizar-producto")
];

/**
 * Muestra el cotizador y oculta la información del taller.
 *
 * servicioId es opcional. Cuando llega un id, buscamos la casilla
 * con ese mismo id y la dejamos seleccionada automáticamente.
 */
function abrirCotizador(servicioId = null) {
  paginaInformacionTaller.hidden = true;
  paginaCotizador.hidden = false;

  if (servicioId) {
    casillasDeServicios.forEach((casillaServicio) => {
      casillaServicio.checked = casillaServicio.id === servicioId;
    });

    actualizarResumenVisual();
  }

  tituloCotizador.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * Oculta el cotizador y vuelve a mostrar la información principal.
 */
function volverAInformacionDelTaller() {
  paginaCotizador.hidden = true;
  paginaInformacionTaller.hidden = false;

  tituloInformacionTaller.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* Cada tarjeta envía el id de su propio servicio al cotizador. */
botonesCotizarProducto.forEach((botonCotizar) => {
  botonCotizar.addEventListener("click", () => {
    const servicioId = botonCotizar.dataset.servicioId;
    abrirCotizador(servicioId);
  });
});

/* El botón general es opcional. Solo se conecta cuando existe en el HTML. */
if (botonAbrirCotizadorGeneral) {
  botonAbrirCotizadorGeneral.addEventListener("click", () => {
    abrirCotizador();
  });
}

botonVolverAInformacion.addEventListener(
  "click",
  volverAInformacionDelTaller
);

/* Escape también permite salir del cotizador y regresar a la información. */
document.addEventListener("keydown", (evento) => {
  const presionoEscape = evento.key === "Escape";
  const cotizadorEstaAbierto = !paginaCotizador.hidden;

  if (presionoEscape && cotizadorEstaAbierto) {
    volverAInformacionDelTaller();
  }
});

/* =============================================================
   12. TARJETAS DESPLEGABLES DEL EQUIPO

   Cada botón controla un bloque de información mediante aria-controls.
   Solo dejamos una tarjeta abierta a la vez para mantener el orden.
   ============================================================= */
const botonesExpandirIntegrante = [
  ...document.querySelectorAll(".boton-expandir-integrante")
];

const imagenesDeEquipo = [
  ...document.querySelectorAll(".detalle-integrante__imagen")
];

/**
 * Cierra la tarjeta relacionada con el botón recibido.
 */
function cerrarDetalleDeIntegrante(botonIntegrante) {
  const idDetalle = botonIntegrante.getAttribute("aria-controls");
  const detalleIntegrante = document.querySelector(`#${idDetalle}`);
  const tarjetaIntegrante = botonIntegrante.closest(".integrante-taller");

  botonIntegrante.setAttribute("aria-expanded", "false");
  detalleIntegrante.hidden = true;
  tarjetaIntegrante.classList.remove("integrante-taller--abierto");
}

/**
 * Abre la tarjeta elegida y cierra cualquier otra que estuviera abierta.
 */
function alternarDetalleDeIntegrante(botonElegido) {
  const estabaAbierto = botonElegido.getAttribute("aria-expanded") === "true";

  botonesExpandirIntegrante.forEach(cerrarDetalleDeIntegrante);

  if (estabaAbierto) {
    return;
  }

  const idDetalle = botonElegido.getAttribute("aria-controls");
  const detalleElegido = document.querySelector(`#${idDetalle}`);
  const tarjetaElegida = botonElegido.closest(".integrante-taller");

  botonElegido.setAttribute("aria-expanded", "true");
  detalleElegido.hidden = false;
  tarjetaElegida.classList.add("integrante-taller--abierto");
}

botonesExpandirIntegrante.forEach((botonIntegrante) => {
  botonIntegrante.addEventListener("click", () => {
    alternarDetalleDeIntegrante(botonIntegrante);
  });
});

/*
  Si todavía no agregaste una foto específica, se utiliza img/top.png.
  Después puedes crear las cuatro fotos con los nombres indicados en el HTML.
*/
imagenesDeEquipo.forEach((imagenEquipo) => {
  imagenEquipo.addEventListener(
    "error",
    () => {
      imagenEquipo.src = imagenEquipo.dataset.imagenRespaldo;
    },
    { once: true }
  );
});
