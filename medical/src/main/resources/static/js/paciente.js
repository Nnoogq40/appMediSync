let pacienteIdActual = null;
let todasLasCitasSistema = [];

const FRANJAS_HORARIAS = [
  "08:00", "08:30", "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00"
];

document.addEventListener("DOMContentLoaded", async () => {
  const authHeader = obtenerAuthHeader();
  const rol = sessionStorage.getItem("medisync_rol");
  const correo = sessionStorage.getItem("medisync_correo");

  if (!authHeader || rol !== "PACIENTE" || !correo) {
    window.location.href = "/login.html";
    return;
  }

  document.getElementById("btn-logout")?.addEventListener("click", cerrarSesion);
  document.getElementById("saludo-paciente").textContent = `Sesión activa: ${correo}`;

  await cargarPerfilPaciente(authHeader);
  await cargarMisCitas(authHeader);
  inicializarCalendario();

  document.getElementById("form-nueva-cita")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    await agendarCita(authHeader);
  });
});

function inicializarCalendario() {
  const inputFecha = document.getElementById("cita-fecha-picker");
  if (!inputFecha || typeof flatpickr === "undefined") return;

  flatpickr(inputFecha, {
    locale: "es",
    minDate: "today",
    dateFormat: "Y-m-d",
    altInput: true,
    altFormat: "l, j \\de F \\de Y",
    disable: [
      function (date) {
        // Deshabilita domingos (0)
        return date.getDay() === 0;
      }
    ],
    onChange: function (selectedDates, dateStr) {
      document.getElementById("cita-hora-seleccionada").value = "";
      renderizarFranjasHorarias(dateStr);
    }
  });

  renderizarFranjasHorarias("");
}

function renderizarFranjasHorarias(fechaSeleccionada) {
  const contenedor = document.getElementById("contenedor-horas");
  const inputHora = document.getElementById("cita-hora-seleccionada");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  if (!fechaSeleccionada) {
    contenedor.innerHTML = "<small>Primero elige una fecha en el calendario.</small>";
    return;
  }

  // Busca horas ya ocupadas en esa fecha (no canceladas)
  const horasOcupadas = new Set(
    todasLasCitasSistema
      .filter((c) => c.estado !== "CANCELADA" && (c.fechaHora || "").startsWith(fechaSeleccionada))
      .map((c) => (c.fechaHora || "").slice(11, 16))
  );

  FRANJAS_HORARIAS.forEach((hora) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = hora;
    btn.className = "btn-hora";

    if (horasOcupadas.has(hora)) {
      btn.disabled = true;
      btn.title = "Horario no disponible";
    } else {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".btn-hora").forEach((b) => b.classList.remove("seleccionada"));
        btn.classList.add("seleccionada");
        inputHora.value = hora;
      });
    }

    contenedor.appendChild(btn);
  });
}

async function cargarPerfilPaciente(authHeader) {
  const res = await fetch("/api/pacientes/me", {
    headers: { Authorization: authHeader }
  });

  if (res.ok) {
    const paciente = await res.json();
    pacienteIdActual = paciente.id;
    document.getElementById("saludo-paciente").textContent =
      `Hola, ${paciente.nombre} (${paciente.correo})`;
  }
}

async function cargarMisCitas(authHeader) {
  const tbody = document.getElementById("tabla-mis-citas");
  const mensaje = document.getElementById("mensaje-paciente");

  if (!pacienteIdActual) {
    tbody.innerHTML = `<tr><td colspan="5">No se pudo identificar tu perfil de paciente.</td></tr>`;
    return;
  }

  // Trae todas para bloquear horas ocupadas en el selector y filtra las del paciente para la tabla
  const res = await fetch("/api/citas", {
    headers: { Authorization: authHeader }
  });

  if (!res.ok) {
    mensaje.textContent = "No se pudieron cargar tus citas.";
    return;
  }

  todasLasCitasSistema = await res.json();
  const misCitas = todasLasCitasSistema.filter(
    (c) => c.paciente && c.paciente.id === pacienteIdActual
  );

  tbody.innerHTML = "";

  if (misCitas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">Aún no tienes citas registradas.</td></tr>`;
    return;
  }

  misCitas.forEach((cita) => {
    const tr = document.createElement("tr");
    const puedeCancelar = cita.estado === "PROGRAMADA";
    const fechaFormateada = (cita.fechaHora || "").replace("T", " ");

    tr.innerHTML = `
      <td>${fechaFormateada}</td>
      <td>${cita.especialidad || ""}</td>
      <td>${cita.motivo || "—"}</td>
      <td>${cita.estado}</td>
      <td>
        ${
          puedeCancelar
            ? `<button type="button" onclick="cancelarMiCita(${cita.id})">Cancelar</button>`
            : "—"
        }
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function agendarCita(authHeader) {
  const mensaje = document.getElementById("mensaje-paciente");
  const fecha = document.getElementById("cita-fecha-picker").value;
  const hora = document.getElementById("cita-hora-seleccionada").value;
  const especialidad = document.getElementById("cita-especialidad").value.trim();
  const motivo = document.getElementById("cita-motivo").value.trim();

  if (!fecha || !hora) {
    mensaje.textContent = "Selecciona una fecha y una hora disponible antes de confirmar.";
    return;
  }

  const cuerpo = {
    pacienteId: pacienteIdActual,
    fechaHora: `${fecha}T${hora}:00`,
    especialidad,
    motivo,
    estado: "PROGRAMADA"
  };

  const res = await fetch("/api/citas", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader
    },
    body: JSON.stringify(cuerpo)
  });

  if (res.ok) {
    mensaje.textContent = "Cita agendada correctamente.";
    document.getElementById("form-nueva-cita").reset();
    document.getElementById("cita-hora-seleccionada").value = "";
    await cargarMisCitas(authHeader);
    renderizarFranjasHorarias("");
    return;
  }

  const errorTexto = await res.text();
  mensaje.textContent = errorTexto || "No se pudo agendar la cita.";
}

async function cancelarMiCita(idCita) {
  const authHeader = obtenerAuthHeader();
  const mensaje = document.getElementById("mensaje-paciente");

  const res = await fetch(`/api/citas/${idCita}/estado`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader
    },
    body: JSON.stringify({ estado: "CANCELADA" })
  });

  if (res.ok) {
    mensaje.textContent = "Cita cancelada.";
    await cargarMisCitas(authHeader);
    const fechaActual = document.getElementById("cita-fecha-picker").value;
    if (fechaActual) renderizarFranjasHorarias(fechaActual);
    return;
  }

  const errorTexto = await res.text();
  mensaje.textContent = errorTexto || "No se pudo cancelar la cita.";
}