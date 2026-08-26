package com.fiaya.dto;

import com.fiaya.model.ClienteEntity;
import com.fiaya.model.MovimientoEntity;
import com.fiaya.model.TiendaEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO que encapsula el snapshot completo de una tienda (tienda, clientes y movimientos)
 * para la sincronización de descarga (Pull Sync) hacia dispositivos móviles.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SyncPullResponse {
    private boolean exito;
    private String mensaje;
    private TiendaEntity tienda;
    private List<ClienteEntity> clientes;
    private List<MovimientoEntity> movimientos;
    private String fechaServidor;
}
