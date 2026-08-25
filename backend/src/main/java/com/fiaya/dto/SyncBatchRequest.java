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
public class SyncBatchRequest {
    private String tiendaId;
    private List<SyncItemDto> mutaciones;
}
