package com.fiaya.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SyncItemDto {
    private String id;
    private String tipoEntidad; // TIENDA, CLIENTE, MOVIMIENTO
    private String operacion;   // CREAR, ACTUALIZAR, ELIMINAR
    private Map<String, Object> payload;
    private String fechaCreacion;
}
