package com.fiaya.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SyncItemResponse {
    private String id;
    private String estado; // SINCRONIZADO, ERROR
    private String mensajeError;
}
