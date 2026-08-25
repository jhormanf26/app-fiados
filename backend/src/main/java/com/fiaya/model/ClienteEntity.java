package com.fiaya.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "clientes", indexes = {
    @Index(name = "idx_cliente_tienda", columnList = "tienda_id"),
    @Index(name = "idx_cliente_doc", columnList = "numero_documento")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClienteEntity {

    @Id
    @Column(length = 36, nullable = false)
    private String id;

    @Column(name = "tienda_id", length = 36, nullable = false)
    private String tiendaId;

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(name = "numero_documento", nullable = false, length = 50)
    private String numeroDocumento;

    @Column(nullable = false, length = 30)
    private String telefono;

    @Column(length = 150)
    private String correo;

    @Column(name = "notificaciones_autorizadas", nullable = false)
    private Boolean notificacionesAutorizadas;

    @Column(name = "correo_verificado", nullable = false)
    private Boolean correoVerificado;

    @Column(name = "limite_credito_personalizado")
    private Double limiteCreditoPersonalizado;

    @Column(name = "saldo_actual", nullable = false)
    private Double saldoActual;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion", nullable = false)
    private LocalDateTime fechaActualizacion;

    @PrePersist
    protected void onCreate() {
        if (notificacionesAutorizadas == null) notificacionesAutorizadas = true;
        if (correoVerificado == null) correoVerificado = false;
        if (saldoActual == null) saldoActual = 0.0;
        if (fechaCreacion == null) fechaCreacion = LocalDateTime.now();
        fechaActualizacion = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        fechaActualizacion = LocalDateTime.now();
    }
}
