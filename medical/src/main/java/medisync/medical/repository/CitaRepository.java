package medisync.medical.repository;

import medisync.medical.model.Cita;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface CitaRepository extends JpaRepository<Cita, Long> {
    boolean existsByFechaHoraAndEstadoNot(LocalDateTime fechaHora, String estado);
    // Busca todas las citas asociadas a un paciente por su ID
    List<Cita> findByPacienteId(Long pacienteId);
}