package medisync.medical.controller;

import medisync.medical.model.Cita;
import medisync.medical.model.Paciente;
import medisync.medical.repository.CitaRepository;
import medisync.medical.repository.PacienteRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/citas")
public class CitaController {

    private final CitaRepository citaRepository;
    private final PacienteRepository pacienteRepository;

    public CitaController(CitaRepository citaRepository, PacienteRepository pacienteRepository) {
        this.citaRepository = citaRepository;
        this.pacienteRepository = pacienteRepository;

    }

    // DTO sencillo para recibir los datos al crear una cita
    public record CrearCitaRequest(
            Long pacienteId,
            LocalDateTime fechaHora,
            String especialidad,
            String motivo,
            String estado

    ) {}

    // Listar todas las citas (GET http://localhost:8080/api/citas)
    @GetMapping
    public List<Cita> listarCitas() {
        return citaRepository.findAll();
    }

    // Listar citas de un paciente específico (GET http://localhost:8080/api/citas/paciente/1)
    @GetMapping("/paciente/{pacienteId}")
    public List<Cita> listarCitasPorPaciente(@PathVariable Long pacienteId) {
        return citaRepository.findByPacienteId(pacienteId);
    }

    // Agendar una cita (POST http://localhost:8080/api/citas)
    @PostMapping
    public ResponseEntity<?> crearCita(@RequestBody CrearCitaRequest request) {
        boolean horarioOcupado = citaRepository.existsByFechaHoraAndEstadoNot(request.fechaHora(), "CANCELADA");
        if (horarioOcupado) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Ya existe una cita agendada en la fecha y hora: " + request.fechaHora());
        }
        if (request.pacienteId() == null) {
            return ResponseEntity.badRequest().body("El campo 'pacienteId' es obligatorio.");

        }

        Optional<Paciente> pacienteOpt = pacienteRepository.findById(request.pacienteId());
        if (pacienteOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No existe un paciente con ID: " + request.pacienteId());
        }

        Cita nuevaCita = new Cita(
                request.fechaHora(),
                request.especialidad(),
                request.motivo(),
                request.estado(),
                pacienteOpt.get()
        );

        Cita guardada = citaRepository.save(nuevaCita);
        return ResponseEntity.status(HttpStatus.CREATED).body(guardada);
    }

    // Actualizar estado o datos de una cita (PUT http://localhost:8080/api/citas/1)
    @PutMapping("/{id}")
    public ResponseEntity<Cita> actualizarCita(@PathVariable Long id, @RequestBody CrearCitaRequest request) {
        return citaRepository.findById(id)
                .map(citaExistente -> {
                    if (request.fechaHora() != null) {
                        citaExistente.setFechaHora(request.fechaHora());
                    }
                    if (request.especialidad() != null) {
                        citaExistente.setEspecialidad(request.especialidad());
                    }
                    if (request.motivo() != null) {
                        citaExistente.setMotivo(request.motivo());
                    }
                    if (request.estado() != null) {
                        citaExistente.setEstado(request.estado());
                    }
                    Cita actualizada = citaRepository.save(citaExistente);
                    return ResponseEntity.ok(actualizada);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Eliminar una cita (DELETE http://localhost:8080/api/citas/1)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarCita(@PathVariable Long id) {
        if (!citaRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        citaRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
    public record CambiarEstadoRequest(String estado) {}

    @PatchMapping("/{id}/estado")
    public ResponseEntity<?> cambiarEstado(@PathVariable Long id, @RequestBody CambiarEstadoRequest request) {
        if (request.estado() == null || request.estado().isBlank()) {
            return ResponseEntity.badRequest().body("El campo 'estado' es obligatorio.");
        }

        String nuevoEstado = request.estado().trim().toUpperCase();
        if (!nuevoEstado.equals("PROGRAMADA") && !nuevoEstado.equals("COMPLETADA") && !nuevoEstado.equals("CANCELADA")) {
            return ResponseEntity.badRequest()
                    .body("Estado no válido. Usa: PROGRAMADA, COMPLETADA o CANCELADA.");
        }

        return citaRepository.findById(id)
                .map(cita -> {
                    cita.setEstado(nuevoEstado);
                    Cita actualizada = citaRepository.save(cita);
                    return ResponseEntity.ok(actualizada);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}