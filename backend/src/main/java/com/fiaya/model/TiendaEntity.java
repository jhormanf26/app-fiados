package com.fiaya.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "tiendas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TiendaEntity {

    @Id
    @Column(length = 36, nullable = false)
    private String id;

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(name = "nombre_propietario", nullable = false, length = 150)
    private String nombrePropietario;

    @Column(name = "documento_propietario", nullable = false, length = 50)
    private String documentoPropietario;

    @Column(nullable = false, length = 30)
    private String telefono;

    @Column(nullable = false, length = 150)
    private String correo;

    @Column(length = 255)
    private String direccion;

    @Column(length = 100)
    private String ciudad;

    @Column(name = "limite_credito_predeterminado", nullable = false)
    private Double limiteCreditoPredeterminado;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion", nullable = false)
    private LocalDateTime fechaActualizacion;

    @PrePersist
    protected void onCreate() {
        if (fechaCreacion == null) {
            fechaCreacion = LocalDateTime.now();
        }
        fechaActualizacion = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        fechaActualizacion = LocalDateTime.now();
    }
}
