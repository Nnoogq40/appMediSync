# MediSync — Backend API

API REST desarrollada con **Spring Boot** y **MySQL** para la gestión de pacientes y citas médicas.

## Tecnologías utilizadas

* **Java** (17 / 21)
* **Spring Boot** (Spring Web, Spring Data JPA)
* **Maven**
* **MySQL** (XAMPP en el puerto `3307`)

## Estructura del proyecto

```text
src/main/java/medisync/medical/
├── controller/   # Endpoints REST (PacienteController, CitaController)
├── model/        # Entidades JPA (Paciente, Cita)
└── repository/   # Interfaces de acceso a datos (PacienteRepository, CitaRepository)
