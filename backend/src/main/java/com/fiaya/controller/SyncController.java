package com.fiaya.controller;

import com.fiaya.dto.SyncBatchRequest;
import com.fiaya.dto.SyncBatchResponse;
import com.fiaya.service.SyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/sync")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SyncController {

    private final SyncService syncService;

    @PostMapping
    public ResponseEntity<SyncBatchResponse> sincronizarLote(@RequestBody SyncBatchRequest request) {
        SyncBatchResponse respuesta = syncService.procesarLoteSincronizacion(request);
        return ResponseEntity.ok(respuesta);
    }
}
