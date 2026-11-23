package medisync.medical.controller;

import medisync.medical.model.Paciente;
import medisync.medical.repository.PacienteRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pacientes")
public class PacienteController {

    private final PacienteRepository pacienteRepository;

    public PacienteController(PacienteRepository pacienteRepository) {
        this.pacienteRepository = pacienteRepository;
    }

    @GetMapping
    public List<Paciente> listarPacientes() {
        return pacienteRepository.findAll();
    }

    @PostMapping
    public Paciente crearPaciente(@RequestBody Paciente paciente) {
        return pacienteRepository.save(paciente);
    }

    // 1. Buscar un paciente por su ID (GET http://localhost:8080/api/pacientes/1)
    @GetMapping("/{id}")
    public ResponseEntity<Paciente> obtenerPacientePorId(@PathVariable Long id) {
        return pacienteRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 2. Actualizar datos de un paciente existente (PUT http://localhost:8080/api/pacientes/1)
    @PutMapping("/{id}")
    public ResponseEntity<Paciente> actualizarPaciente(@PathVariable Long id, @RequestBody Paciente detallesPaciente) {
        return pacienteRepository.findById(id)
                .map(pacienteExistente -> {
                    pacienteExistente.setNombre(detallesPaciente.getNombre());
                    pacienteExistente.setCorreo(detallesPaciente.getCorreo());
                    pacienteExistente.setTelefono(detallesPaciente.getTelefono());
                    if (detallesPaciente.getPassword() != null && !detallesPaciente.getPassword().isBlank()) {
                        pacienteExistente.setPassword(detallesPaciente.getPassword());
                    }
                    Paciente actualizado = pacienteRepository.save(pacienteExistente);
                    return ResponseEntity.ok(actualizado);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // 3. Eliminar un paciente por su ID (DELETE http://localhost:8080/api/pacientes/1)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarPaciente(@PathVariable Long id) {
        if (!pacienteRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        pacienteRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}