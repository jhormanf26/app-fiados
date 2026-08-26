package com.fiaya.service;

import com.fiaya.dto.*;
import com.fiaya.model.*;
import com.fiaya.repository.ClienteRepository;
import com.fiaya.repository.MovimientoRepository;
import com.fiaya.repository.TiendaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SyncService {

    private final TiendaRepository tiendaRepository;
    private final ClienteRepository clienteRepository;
    private final MovimientoRepository movimientoRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public SyncBatchResponse procesarLoteSincronizacion(SyncBatchRequest request) {
        List<SyncItemResponse> resultados = new ArrayList<>();
        int procesados = 0;

        if (request != null && request.getMutaciones() != null) {
            log.info("🔄 [SyncService] Procesando lote de {} mutaciones para Tienda ID: '{}'",
                    request.getMutaciones().size(), request.getTiendaId());

            for (SyncItemDto item : request.getMutaciones()) {
                try {
                    log.info("  👉 Procesando Item ID: '{}', Tipo: '{}', Operación: '{}'",
                            item.getId(), item.getTipoEntidad(), item.getOperacion());

                    procesarItem(item);

                    resultados.add(SyncItemResponse.builder()
                            .id(item.getId())
                            .estado("SINCRONIZADO")
                            .build());
                    procesados++;
                    log.info("  ✅ Item ID: '{}' sincronizado exitosamente en MySQL.", item.getId());
                } catch (Exception e) {
                    log.error("  ❌ Error al procesar Item ID: '{}'. Mensaje: {}", item.getId(), e.getMessage(), e);
                    resultados.add(SyncItemResponse.builder()
                            .id(item.getId())
                            .estado("ERROR")
                            .mensajeError(e.getMessage())
                            .build());
                }
            }
        } else {
            log.warn("⚠️ [SyncService] Petición de sincronización recibida vacía o con mutaciones nulas.");
        }

        return SyncBatchResponse.builder()
                .exito(true)
                .procesados(procesados)
                .resultados(resultados)
                .fechaServidor(LocalDateTime.now().toString())
                .build();
    }

    /**
     * Obtiene el snapshot completo de una tienda validando su documento y contraseña ingresada.
     */
    @Transactional(readOnly = true)
    public SyncPullResponse obtenerSnapshotTiendaPorDocumento(String documentoPropietario, String claveIngresada) {
        if (documentoPropietario == null || documentoPropietario.trim().isEmpty()) {
            throw new IllegalArgumentException("El documento del propietario no puede estar vacío");
        }

        String docLimpio = documentoPropietario.trim();
        log.info("🔍 [SyncService] Buscando snapshot de tienda para documento: '{}'", docLimpio);

        TiendaEntity tienda = tiendaRepository.findByDocumentoPropietario(docLimpio)
                .orElseThrow(() -> new IllegalArgumentException("No se encontró ninguna tienda registrada con el documento '" + docLimpio + "'."));

        // Validar contraseña
        if (claveIngresada != null && !claveIngresada.trim().isEmpty()) {
            String claveLimpia = claveIngresada.trim();
            if (tienda.getClave() != null && !tienda.getClave().isEmpty()) {
                if (!passwordEncoder.matches(claveLimpia, tienda.getClave())) {
                    log.warn("⛔ [SyncService] Contraseña incorrecta ingresada para Tienda ID: '{}', Documento: '{}'", tienda.getId(), docLimpio);
                    throw new IllegalArgumentException("Contraseña incorrecta. Por favor verifica la clave ingresada.");
                }
            } else {
                // Si la tienda aún no tiene clave encriptada guardada, verificar contra el NIT por defecto
                if (!claveLimpia.equalsIgnoreCase(docLimpio) && !claveLimpia.equals(tienda.getClave())) {
                    throw new IllegalArgumentException("Contraseña incorrecta. Por favor verifica la clave ingresada.");
                }
            }
        }

        return construirSnapshotRespuesta(tienda);
    }

    /**
     * Obtiene el snapshot completo de una tienda por su ID de entidad (tienda, clientes y movimientos)
     */
    @Transactional(readOnly = true)
    public SyncPullResponse obtenerSnapshotTiendaPorId(String tiendaId) {
        if (tiendaId == null || tiendaId.trim().isEmpty()) {
            throw new IllegalArgumentException("El ID de tienda no puede estar vacío");
        }

        log.info("🔍 [SyncService] Buscando snapshot de tienda para Tienda ID: '{}'", tiendaId);

        TiendaEntity tienda = tiendaRepository.findById(tiendaId.trim())
                .orElseThrow(() -> new IllegalArgumentException("No se encontró ninguna tienda con el ID '" + tiendaId + "'."));

        return construirSnapshotRespuesta(tienda);
    }

    private SyncPullResponse construirSnapshotRespuesta(TiendaEntity tienda) {
        List<ClienteEntity> clientes = clienteRepository.findByTiendaId(tienda.getId());
        List<MovimientoEntity> movimientos = movimientoRepository.findByTiendaIdOrderByFechaCreacionDesc(tienda.getId());

        log.info("📦 [SyncService] Snapshot generado para Tienda ID: '{}' (Clientes: {}, Movimientos: {})",
                tienda.getId(), clientes.size(), movimientos.size());

        return SyncPullResponse.builder()
                .exito(true)
                .mensaje("Snapshot descargado exitosamente.")
                .tienda(tienda)
                .clientes(clientes)
                .movimientos(movimientos)
                .fechaServidor(LocalDateTime.now().toString())
                .build();
    }

    private void procesarItem(SyncItemDto item) {
        String tipo = item.getTipoEntidad();
        Map<String, Object> payload = item.getPayload();

        if ("TIENDA".equalsIgnoreCase(tipo)) {
            procesarTienda(item.getId(), payload);
        } else if ("CLIENTE".equalsIgnoreCase(tipo)) {
            procesarCliente(item.getId(), payload);
        } else if ("MOVIMIENTO".equalsIgnoreCase(tipo)) {
            procesarMovimiento(item.getId(), payload);
        } else {
            throw new IllegalArgumentException("Tipo de entidad desconocido: " + tipo);
        }
    }

    private String aString(Object o) {
        if (o == null) return null;
        return String.valueOf(o);
    }

    private void procesarTienda(String id, Map<String, Object> p) {
        TiendaEntity tienda = tiendaRepository.findById(id)
                .orElse(TiendaEntity.builder().id(id).build());

        if (p.containsKey("nombre")) tienda.setNombre(aString(p.get("nombre")));
        if (p.containsKey("nombrePropietario")) tienda.setNombrePropietario(aString(p.get("nombrePropietario")));
        if (p.containsKey("documentoPropietario")) tienda.setDocumentoPropietario(aString(p.get("documentoPropietario")));
        if (p.containsKey("telefono")) tienda.setTelefono(aString(p.get("telefono")));
        if (p.containsKey("correo")) tienda.setCorreo(aString(p.get("correo")));
        if (p.containsKey("direccion")) tienda.setDireccion(aString(p.get("direccion")));
        if (p.containsKey("ciudad")) tienda.setCiudad(aString(p.get("ciudad")));
        if (p.containsKey("limiteCreditoPredeterminado")) {
            tienda.setLimiteCreditoPredeterminado(((Number) p.get("limiteCreditoPredeterminado")).doubleValue());
        }

        // Manejo de contraseña (Clave):
        if (p.containsKey("clave") && p.get("clave") != null) {
            String rawClave = aString(p.get("clave")).trim();
            if (rawClave.startsWith("$2a$") || rawClave.startsWith("$2b$")) {
                tienda.setClave(rawClave);
            } else {
                tienda.setClave(passwordEncoder.encode(rawClave));
            }
        } else if (tienda.getClave() == null && tienda.getDocumentoPropietario() != null) {
            // Contraseña por defecto = NIT/Cédula
            tienda.setClave(passwordEncoder.encode(tienda.getDocumentoPropietario().trim()));
        }

        tiendaRepository.save(tienda);
        log.info("  🏬 [MySQL Save] Tienda guardada exitosamente ID: '{}', Nombre: '{}'", id, tienda.getNombre());
    }

    private void procesarCliente(String id, Map<String, Object> p) {
        ClienteEntity cliente = clienteRepository.findById(id)
                .orElse(ClienteEntity.builder().id(id).build());

        if (p.containsKey("tiendaId")) cliente.setTiendaId(aString(p.get("tiendaId")));
        if (p.containsKey("nombre")) cliente.setNombre(aString(p.get("nombre")));
        if (p.containsKey("numeroDocumento")) cliente.setNumeroDocumento(aString(p.get("numeroDocumento")));
        if (p.containsKey("telefono")) cliente.setTelefono(aString(p.get("telefono")));
        if (p.containsKey("correo")) cliente.setCorreo(aString(p.get("correo")));
        if (p.containsKey("notificacionesAutorizadas")) {
            cliente.setNotificacionesAutorizadas((Boolean) p.get("notificacionesAutorizadas"));
        }
        if (p.containsKey("correoVerificado")) {
            cliente.setCorreoVerificado((Boolean) p.get("correoVerificado"));
        }
        if (p.containsKey("limiteCreditoPersonalizado") && p.get("limiteCreditoPersonalizado") != null) {
            cliente.setLimiteCreditoPersonalizado(((Number) p.get("limiteCreditoPersonalizado")).doubleValue());
        }
        if (p.containsKey("saldoActual")) {
            cliente.setSaldoActual(((Number) p.get("saldoActual")).doubleValue());
        }

        clienteRepository.save(cliente);
        log.info("  👤 [MySQL Save] Cliente guardado exitosamente ID: '{}', Nombre: '{}', Saldo Actual: ${}",
                id, cliente.getNombre(), cliente.getSaldoActual());
    }

    private void procesarMovimiento(String id, Map<String, Object> p) {
        // Garantía de Idempotencia: Si el UUID del movimiento ya existe en MySQL, no volver a insertar
        if (movimientoRepository.existsById(id)) {
            log.info("  ⏩ [Idempotencia] Movimiento ID: '{}' ya existe en MySQL, omitiendo duplicado.", id);
            return;
        }

        MovimientoEntity mov = MovimientoEntity.builder()
                .id(id)
                .tiendaId(aString(p.get("tiendaId")))
                .clienteId(aString(p.get("clienteId")))
                .tipo(TipoMovimiento.valueOf(aString(p.get("tipo")).toUpperCase()))
                .monto(((Number) p.get("monto")).doubleValue())
                .descripcion(aString(p.get("descripcion")))
                .saldoAnterior(((Number) p.get("saldoAnterior")).doubleValue())
                .nuevoSaldo(((Number) p.get("nuevoSaldo")).doubleValue())
                .motivoAnulacion(aString(p.get("motivoAnulacion")))
                .estadoSincronizacion(EstadoSincronizacion.SINCRONIZADO)
                .build();

        movimientoRepository.save(mov);
        log.info("  💵 [MySQL Save] Movimiento guardado exitosamente ID: '{}', Tipo: {}, Monto: ${}, Cliente ID: '{}'",
                id, mov.getTipo(), mov.getMonto(), mov.getClienteId());

        // Actualizar saldo del cliente en MySQL
        clienteRepository.findById(mov.getClienteId()).ifPresent(c -> {
            c.setSaldoActual(mov.getNuevoSaldo());
            clienteRepository.save(c);
            log.info("  🔄 [MySQL Update] Saldo de Cliente ID: '{}' actualizado a ${}", c.getId(), c.getSaldoActual());
        });
    }
}
