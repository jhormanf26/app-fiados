package com.fiaya.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/")
public class HomeController {

    @GetMapping
    public ResponseEntity<Map<String, Object>> inicio() {
        return ResponseEntity.ok(Map.of(
            "app", "FiaYa Backend API & Motor de Sincronización",
            "estado", "OPERATIVO",
            "version", "1.0.0",
            "baseDeDatos", "Conectado a MySQL (FiaYa)",
            "servicios", Map.of(
                "sincronizacion", "/api/v1/sync",
                "sincronizacionPull", "/api/v1/sync/pull/{documentoPropietario}",
                "consultaPublica", "/api/v1/public/cliente-consulta"
            )
        ));
    }
}
