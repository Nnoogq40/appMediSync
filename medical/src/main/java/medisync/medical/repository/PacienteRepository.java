package medisync.medical.repository;

import medisync.medical.model.Paciente; // Ajusta si tu entidad está en otro paquete
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PacienteRepository extends JpaRepository<Paciente, Long> {

    // Método personalizado: Spring JPA arma la consulta SQL solo por el nombre del método
    Optional<Paciente> findByCorreo(String correo);
}