package com.fiaya.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "movimientos", indexes = {
    @Index(name = "idx_mov_tienda", columnList = "tienda_id"),
    @Index(name = "idx_mov_cliente", columnList = "cliente_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovimientoEntity {

    @Id
    @Column(length = 36, nullable = false)
    private String id;

    @Column(name = "tienda_id", length = 36, nullable = false)
    private String tiendaId;

    @Column(name = "cliente_id", length = 36, nullable = false)
    private String clienteId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoMovimiento tipo;

    @Column(nullable = false)
    private Double monto;

    @Column(length = 255)
    private String descripcion;

    @Column(name = "saldo_anterior", nullable = false)
    private Double saldoAnterior;

    @Column(name = "nuevo_saldo", nullable = false)
    private Double nuevoSaldo;

    @Column(name = "motivo_anulacion", length = 255)
    private String motivoAnulacion;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_sincronizacion", nullable = false, length = 20)
    private EstadoSincronizacion estadoSincronizacion;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_sincronizacion")
    private LocalDateTime fechaSincronizacion;

    @PrePersist
    protected void onCreate() {
        if (fechaCreacion == null) fechaCreacion = LocalDateTime.now();
        if (estadoSincronizacion == null) estadoSincronizacion = EstadoSincronizacion.SINCRONIZADO;
        fechaSincronizacion = LocalDateTime.now();
    }
}
