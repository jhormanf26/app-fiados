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

        String nombre = p.get("nombre") != null ? aString(p.get("nombre")) : aString(p.get("nombre_tienda"));
        String nombreProp = p.get("nombrePropietario") != null ? aString(p.get("nombrePropietario")) : aString(p.get("nombre_propietario"));
        String docProp = p.get("documentoPropietario") != null ? aString(p.get("documentoPropietario")) : aString(p.get("documento_propietario"));
        String tel = aString(p.get("telefono"));
        String email = aString(p.get("correo"));
        String dir = aString(p.get("direccion"));
        String ciu = aString(p.get("ciudad"));

        tienda.setNombre((nombre != null && !nombre.trim().isEmpty()) ? nombre.trim() : "Mi Tienda FiaYa");
        tienda.setNombrePropietario((nombreProp != null && !nombreProp.trim().isEmpty()) ? nombreProp.trim() : "Propietario");
        tienda.setDocumentoPropietario((docProp != null && !docProp.trim().isEmpty()) ? docProp.trim() : "1098765432");
        tienda.setTelefono((tel != null && !tel.trim().isEmpty()) ? tel.trim() : "3000000000");
        tienda.setCorreo((email != null && !email.trim().isEmpty()) ? email.trim() : "tienda@fiaya.com");
        if (dir != null) tienda.setDireccion(dir);
        if (ciu != null) tienda.setCiudad(ciu);

        if (p.containsKey("limiteCreditoPredeterminado") && p.get("limiteCreditoPredeterminado") != null) {
            tienda.setLimiteCreditoPredeterminado(((Number) p.get("limiteCreditoPredeterminado")).doubleValue());
        } else if (tienda.getLimiteCreditoPredeterminado() == null) {
            tienda.setLimiteCreditoPredeterminado(100000.0);
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
            tienda.setClave(passwordEncoder.encode(tienda.getDocumentoPropietario().trim()));
        }

        tiendaRepository.save(tienda);
        log.info("  🏬 [MySQL Save] Tienda guardada exitosamente ID: '{}', Nombre: '{}'", id, tienda.getNombre());
    }

    private void procesarCliente(String id, Map<String, Object> p) {
        ClienteEntity cliente = clienteRepository.findById(id)
                .orElse(ClienteEntity.builder().id(id).build());

        String tiendaId = p.get("tiendaId") != null ? aString(p.get("tiendaId")) : aString(p.get("tienda_id"));
        String nombre = aString(p.get("nombre"));
        String doc = p.get("numeroDocumento") != null ? aString(p.get("numeroDocumento")) : aString(p.get("numero_documento"));

        if (tiendaId != null) cliente.setTiendaId(tiendaId);
        cliente.setNombre(nombre != null ? nombre : "Cliente");
        cliente.setNumeroDocumento(doc != null ? doc : "1098765432");

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
        if (p.containsKey("saldoActual") && p.get("saldoActual") != null) {
            cliente.setSaldoActual(((Number) p.get("saldoActual")).doubleValue());
        } else if (p.containsKey("saldo_actual") && p.get("saldo_actual") != null) {
            cliente.setSaldoActual(((Number) p.get("saldo_actual")).doubleValue());
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

        String tId = p.get("tiendaId") != null ? aString(p.get("tiendaId")) : aString(p.get("tienda_id"));
        String cId = p.get("clienteId") != null ? aString(p.get("clienteId")) : aString(p.get("cliente_id"));
        String sAnt = p.get("saldoAnterior") != null ? aString(p.get("saldoAnterior")) : aString(p.get("saldo_anterior"));
        String sNue = p.get("nuevoSaldo") != null ? aString(p.get("nuevoSaldo")) : aString(p.get("nuevo_saldo"));

        MovimientoEntity mov = MovimientoEntity.builder()
                .id(id)
                .tiendaId(tId)
                .clienteId(cId)
                .tipo(TipoMovimiento.valueOf(aString(p.get("tipo")).toUpperCase()))
                .monto(((Number) p.get("monto")).doubleValue())
                .descripcion(aString(p.get("descripcion")))
                .saldoAnterior(sAnt != null ? Double.parseDouble(sAnt) : 0.0)
                .nuevoSaldo(sNue != null ? Double.parseDouble(sNue) : 0.0)
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
