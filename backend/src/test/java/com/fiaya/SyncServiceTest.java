package com.fiaya;

import com.fiaya.dto.*;
import com.fiaya.model.*;
import com.fiaya.repository.ClienteRepository;
import com.fiaya.repository.MovimientoRepository;
import com.fiaya.repository.TiendaRepository;
import com.fiaya.service.SyncService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class SyncServiceTest {

    @Autowired
    private SyncService syncService;

    @Autowired
    private TiendaRepository tiendaRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private MovimientoRepository movimientoRepository;

    @BeforeEach
    void setUp() {
        movimientoRepository.deleteAll();
        clienteRepository.deleteAll();
        tiendaRepository.deleteAll();
    }

    @Test
    @DisplayName("Debe procesar lote de sincronización de tienda, cliente y fiado e ignorar duplicados idempotentes")
    void testSincronizacionLoteEIdempotencia() {
        String tiendaId = UUID.randomUUID().toString();
        String clienteId = UUID.randomUUID().toString();
        String movFiadoId = UUID.randomUUID().toString();

        // 1. Mutación Tienda
        Map<String, Object> payloadTienda = new HashMap<>();
        payloadTienda.put("nombre", "Granero Don Pedro");
        payloadTienda.put("nombrePropietario", "Pedro Gómez");
        payloadTienda.put("documentoPropietario", "1098765432");
        payloadTienda.put("telefono", "3001234567");
        payloadTienda.put("correo", "donpedro@example.com");
        payloadTienda.put("limiteCreditoPredeterminado", 200000.0);

        SyncItemDto itemTienda = SyncItemDto.builder()
                .id(tiendaId)
                .tipoEntidad("TIENDA")
                .operacion("CREAR")
                .payload(payloadTienda)
                .build();

        // 2. Mutación Cliente
        Map<String, Object> payloadCliente = new HashMap<>();
        payloadCliente.put("tiendaId", tiendaId);
        payloadCliente.put("nombre", "María López");
        payloadCliente.put("numeroDocumento", "52123456");
        payloadCliente.put("telefono", "3159876543");
        payloadCliente.put("saldoActual", 0.0);

        SyncItemDto itemCliente = SyncItemDto.builder()
                .id(clienteId)
                .tipoEntidad("CLIENTE")
                .operacion("CREAR")
                .payload(payloadCliente)
                .build();

        // 3. Mutación Movimiento (Fiado)
        Map<String, Object> payloadMov = new HashMap<>();
        payloadMov.put("tiendaId", tiendaId);
        payloadMov.put("clienteId", clienteId);
        payloadMov.put("tipo", "FIADO");
        payloadMov.put("monto", 45000.0);
        payloadMov.put("descripcion", "Compra mercado fin de semana");
        payloadMov.put("saldoAnterior", 0.0);
        payloadMov.put("nuevoSaldo", 45000.0);

        SyncItemDto itemMov = SyncItemDto.builder()
                .id(movFiadoId)
                .tipoEntidad("MOVIMIENTO")
                .operacion("CREAR")
                .payload(payloadMov)
                .build();

        SyncBatchRequest request = SyncBatchRequest.builder()
                .tiendaId(tiendaId)
                .mutaciones(List.of(itemTienda, itemCliente, itemMov))
                .build();

        // Ejecutar Sincronización Inicial
        SyncBatchResponse response = syncService.procesarLoteSincronizacion(request);

        assertTrue(response.isExito());
        assertEquals(3, response.getProcesados());
        assertEquals(1, tiendaRepository.count());
        assertEquals(1, clienteRepository.count());
        assertEquals(1, movimientoRepository.count());

        // Verificar que el saldo del cliente en MySQL se actualizó a $45,000
        ClienteEntity clienteEnBD = clienteRepository.findById(clienteId).orElseThrow();
        assertEquals(45000.0, clienteEnBD.getSaldoActual());

        // 4. Probar Idempotencia: Re-enviar el mismo lote exactamente igual (simulando reconexión)
        SyncBatchResponse responseReintento = syncService.procesarLoteSincronizacion(request);
        assertTrue(responseReintento.isExito());
        assertEquals(3, responseReintento.getProcesados());

        // Verificar que NO se duplicaron registros en MySQL
        assertEquals(1, tiendaRepository.count());
        assertEquals(1, clienteRepository.count());
        assertEquals(1, movimientoRepository.count());
    }
}
