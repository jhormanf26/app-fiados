package com.fiaya.controller;

import com.fiaya.dto.ConsultaClienteResponse;
import com.fiaya.model.ClienteEntity;
import com.fiaya.model.TiendaEntity;
import com.fiaya.repository.ClienteRepository;
import com.fiaya.repository.TiendaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/public/cliente-consulta")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ClienteConsultaPublicaController {

    private final ClienteRepository clienteRepository;
    private final TiendaRepository tiendaRepository;

    @GetMapping
    public ResponseEntity<ConsultaClienteResponse> consultarDeudaPorDocumento(@RequestParam("documento") String documento) {
        if (documento == null || documento.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        List<ClienteEntity> coincidencias = clienteRepository.findByNumeroDocumento(documento.trim());
        if (coincidencias.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        double sumaDeuda = 0.0;
        List<ConsultaClienteResponse.DeudaTiendaDto> listaTiendas = new ArrayList<>();

        for (ClienteEntity c : coincidencias) {
            String nombreTienda = "Tienda Registrada";
            String ciudad = "";

            if (c.getTiendaId() != null) {
                TiendaEntity t = tiendaRepository.findById(c.getTiendaId()).orElse(null);
                if (t != null) {
                    nombreTienda = t.getNombre();
                    ciudad = t.getCiudad();
                }
            }

            double saldo = c.getSaldoActual() != null ? c.getSaldoActual() : 0.0;
            if (saldo > 0) {
                sumaDeuda += saldo;
            }

            listaTiendas.add(ConsultaClienteResponse.DeudaTiendaDto.builder()
                    .tiendaId(c.getTiendaId())
                    .nombreTienda(nombreTienda)
                    .ciudad(ciudad)
                    .saldoActual(saldo)
                    .ultimaSincronizacion(c.getFechaActualizacion() != null ? c.getFechaActualizacion().toString() : "")
                    .build());
        }

        ConsultaClienteResponse response = ConsultaClienteResponse.builder()
                .numeroDocumento(documento.trim())
                .deudaTotalConsolidada(sumaDeuda)
                .tiendas(listaTiendas)
                .build();

        return ResponseEntity.ok(response);
    }
}
