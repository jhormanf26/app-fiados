package com.fiaya.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsultaClienteResponse {

    private String numeroDocumento;
    private Double deudaTotalConsolidada;
    private List<DeudaTiendaDto> tiendas;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DeudaTiendaDto {
        private String tiendaId;
        private String nombreTienda;
        private String ciudad;
        private Double saldoActual;
        private String ultimaSincronizacion;
    }
}
