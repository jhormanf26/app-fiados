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
public class SyncBatchResponse {
    private boolean exito;
    private int procesados;
    private List<SyncItemResponse> resultados;
    private String fechaServidor;
}
