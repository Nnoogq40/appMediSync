const API_PACIENTES = "/api/pacientes";
const API_CITAS = "/api/citas";

function mostrarMensaje(elementoId, texto) {
  const box = document.getElementById(elementoId);
  box.textContent = texto;
  box.hidden = false;
}

async function cargarPacientes() {
  const res = await fetch(API_PACIENTES);
  const pacientes = await res.json();

  const ul = document.getElementById("lista-pacientes");
  ul.innerHTML = pacientes
    .map((p) => `<li><strong>#${p.id}</strong> — ${p.nombre} (${p.telefono})</li>`)
    .join("");

  const select = document.getElementById("cita-paciente-id");
  const seleccionPrevia = select.value;
  select.innerHTML =
    '<option value="">Selecciona un paciente...</option>' +
    pacientes
      .map((p) => `<option value="${p.id}">#${p.id} — ${p.nombre}</option>`)
      .join("");

  if (seleccionPrevia) {
    select.value = seleccionPrevia;
  }
}

async function cargarCitas() {
  const res = await fetch(API_CITAS);
  const citas = await res.json();
  const ul = document.getElementById("lista-citas");

  ul.innerHTML = citas
    .map((c) => {
      const pacId = c.paciente?.id ?? "?";
      const pacNombre = c.paciente?.nombre ?? "Paciente";
      return `
        <li class="cita-item">
          <div>
            <strong>#${c.id}</strong> [${c.estado}] ${c.fechaHora} — ${c.especialidad}
            <br />
            <small>Paciente #${pacId}: ${pacNombre}${c.motivo ? ` | Motivo: ${c.motivo}` : ""}</small>
          </div>
          <div class="cita-acciones">
            <button type="button" class="btn-completar" onclick="cambiarEstadoCita(${c.id}, 'COMPLETADA')">Completar</button>
            <button type="button" class="btn-cancelar" onclick="cambiarEstadoCita(${c.id}, 'CANCELADA')">Cancelar</button>
            <button type="button" class="btn-eliminar" onclick="eliminarCita(${c.id})">Eliminar</button>
          </div>
        </li>
      `;
    })
    .join("");
}

async function cambiarEstadoCita(id, estado) {
  const res = await fetch(`${API_CITAS}/${id}/estado`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado }),
  });

  const texto = await res.text();
  if (res.ok) {
    mostrarMensaje("msg-cita", `Cita #${id} actualizada a ${estado}.`);
    cargarCitas();
  } else {
    mostrarMensaje("msg-cita", `Error al cambiar estado (${res.status}): ${texto}`);
  }
}

async function eliminarCita(id) {
  const res = await fetch(`${API_CITAS}/${id}`, {
    method: "DELETE",
  });

  if (res.ok || res.status === 204) {
    mostrarMensaje("msg-cita", `Cita #${id} eliminada.`);
    cargarCitas();
  } else {
    mostrarMensaje("msg-cita", `No se pudo eliminar la cita #${id} (${res.status}).`);
  }
}

document.getElementById("form-paciente").addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    nombre: document.getElementById("pac-nombre").value.trim(),
    correo: document.getElementById("pac-correo").value.trim(),
    password: document.getElementById("pac-password").value,
    telefono: document.getElementById("pac-telefono").value.trim(),
  };

  const res = await fetch(API_PACIENTES, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    e.target.reset();
    mostrarMensaje("msg-paciente", "Paciente guardado correctamente.");
    cargarPacientes();
  } else {
    mostrarMensaje("msg-paciente", `Error al guardar paciente (${res.status}).`);
  }
});

document.getElementById("form-cita").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fechaInput = document.getElementById("cita-fecha").value;
  const fechaIso = fechaInput.length === 16 ? `${fechaInput}:00` : fechaInput;

  const payload = {
    pacienteId: Number(document.getElementById("cita-paciente-id").value),
    fechaHora: fechaIso,
    especialidad: document.getElementById("cita-especialidad").value.trim(),
    motivo: document.getElementById("cita-motivo").value.trim(),
    estado: document.getElementById("cita-estado").value,
  };

  const res = await fetch(API_CITAS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const texto = await res.text();
  if (res.ok) {
    e.target.reset();
    mostrarMensaje("msg-cita", "Cita agendada con éxito.");
    cargarCitas();
  } else {
    mostrarMensaje("msg-cita", `Respuesta (${res.status}): ${texto}`);
  }
});

cargarPacientes();
cargarCitas();