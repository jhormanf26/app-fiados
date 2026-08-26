package com.fiaya.controller;

import com.fiaya.dto.SyncBatchRequest;
import com.fiaya.dto.SyncBatchResponse;
import com.fiaya.service.SyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/sync")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SyncController {

    private final SyncService syncService;

    @PostMapping
    public ResponseEntity<SyncBatchResponse> sincronizarLote(@RequestBody SyncBatchRequest request) {
        int cantidadMutaciones = (request != null && request.getMutaciones() != null) ? request.getMutaciones().size() : 0;
        log.info("📥 [SyncController] Petición POST /api/v1/sync recibida de Tienda ID: '{}' con {} mutaciones",
                request != null ? request.getTiendaId() : "N/A", cantidadMutaciones);

        SyncBatchResponse respuesta = syncService.procesarLoteSincronizacion(request);

        log.info("📤 [SyncController] Respuesta completada. Éxito: {}, Procesados exitosos: {}/{}",
                respuesta.isExito(), respuesta.getProcesados(), cantidadMutaciones);
        return ResponseEntity.ok(respuesta);
    }
}
