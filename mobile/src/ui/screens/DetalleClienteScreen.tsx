import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Divider, Chip, IconButton, ActivityIndicator, ProgressBar, Modal, Portal, TextInput, HelperText } from 'react-native-paper';
import { clienteRepository } from '../../core/repositories/clienteRepository';
import { movimientoRepository } from '../../core/repositories/movimientoRepository';
import { tiendaRepository } from '../../core/repositories/tiendaRepository';
import { Cliente, Movimiento, Tienda } from '../../core/types/database';
import { NuevoMovimientoModal } from '../modals/NuevoMovimientoModal';
import { CrearClienteModal } from '../modals/CrearClienteModal';
import { useAppTheme } from '../theme/ThemeContext';

function obtenerIniciales(nombre: string): string {
  if (!nombre) return 'CL';
  const partes = nombre.trim().split(' ').filter(Boolean);
  if (partes.length >= 2) {
    return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
  }
  return partes[0].substring(0, 2).toUpperCase();
}

function formatearFechaRelativa(isoString: string): string {
  try {
    const fecha = new Date(isoString);
    const ahora = new Date();
    const difMs = ahora.getTime() - fecha.getTime();
    const difDias = Math.floor(difMs / (1000 * 60 * 60 * 24));

    const horaStr = fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (difDias === 0) {
      return `Hoy, ${horaStr}`;
    } else if (difDias === 1) {
      return `Ayer`;
    } else if (difDias > 1 && difDias < 7) {
      return `Hace ${difDias} días`;
    }
    return `${fecha.toLocaleDateString()} ${horaStr}`;
  } catch (e) {
    return isoString;
  }
}

export const DetalleClienteScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { isDarkMode, colors } = useAppTheme();
  const { clienteId } = route.params;
  const [tienda, setTienda] = useState<Tienda | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [limiteEfectivo, setLimiteEfectivo] = useState<number>(100000);
  const [historial, setHistorial] = useState<Movimiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalMovimientoVisible, setModalMovimientoVisible] = useState(false);
  const [modalEditarVisible, setModalEditarVisible] = useState(false);

  // Estado para modal cross-platform de anulación de movimientos
  const [movimientoAAnular, setMovimientoAAnular] = useState<Movimiento | null>(null);
  const [motivoAnulacionInput, setMotivoAnulacionInput] = useState('');
  const [errorAnulacion, setErrorAnulacion] = useState<string | null>(null);
  const [anulando, setAnulando] = useState(false);

  const cargarDatos = useCallback(async () => {
    try {
      const t = await tiendaRepository.obtenerTienda();
      setTienda(t);

      const c = await clienteRepository.obtenerClientePorId(clienteId);
      if (c) {
        setCliente(c);
        const lim = await clienteRepository.obtenerLimiteCreditoEfectivo(c);
        setLimiteEfectivo(lim);

        const h = await movimientoRepository.obtenerHistorialCliente(c.id);
        setHistorial(h);
      }
    } catch (err) {
      console.error('Error al cargar detalle del cliente:', err);
    } finally {
      setCargando(false);
    }
  }, [clienteId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleAbrirAnular = (movimiento: Movimiento) => {
    if (movimiento.tipo === 'ANULACION') return;
    setMovimientoAAnular(movimiento);
    setMotivoAnulacionInput('');
    setErrorAnulacion(null);
  };

  const handleConfirmarAnulacion = async () => {
    if (!movimientoAAnular) return;
    if (!motivoAnulacionInput.trim()) {
      setErrorAnulacion('Por favor ingresa un motivo para anular este movimiento.');
      return;
    }

    setAnulando(true);
    setErrorAnulacion(null);
    try {
      await movimientoRepository.anularMovimiento(movimientoAAnular.id, motivoAnulacionInput.trim());
      setMovimientoAAnular(null);
      setMotivoAnulacionInput('');
      await cargarDatos();
    } catch (err: any) {
      setErrorAnulacion(err.message || 'Error al anular el movimiento.');
    } finally {
      setAnulando(false);
    }
  };

  if (cargando || !cliente) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const limiteSuperado = cliente.saldoActual > limiteEfectivo;
  const porcentajeUtilizado = limiteEfectivo > 0 ? Math.round((cliente.saldoActual / limiteEfectivo) * 100) : 0;
  const progresoBarra = Math.min(cliente.saldoActual / (limiteEfectivo || 1), 1);
  const iniciales = obtenerIniciales(cliente.nombre);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Encabezado Superior FiaYa: Flecha atrás + FiaYa + Synced */}
      <View style={[styles.topHeaderBar, { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' }]}>
        <IconButton
          icon="arrow-left"
          iconColor={colors.text}
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text variant="titleMedium" style={{ color: '#6200ee', fontWeight: 'bold', fontSize: 18 }}>
          FiaYa
        </Text>
        <Chip
          icon="check-circle"
          style={{ backgroundColor: '#e8f5e9' }}
          textStyle={{ color: '#2e7d32', fontWeight: 'bold', fontSize: 11 }}
        >
          Synced
        </Chip>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Tarjeta Perfil del Cliente Stitch */}
        <Card style={[styles.cardProfile, { backgroundColor: colors.card }]} mode="outlined">
          <Card.Content style={{ alignItems: 'center', paddingVertical: 20 }}>
            <View
              style={[
                styles.avatarLarge,
                { backgroundColor: cliente.saldoActual > 0 ? '#6200ee' : colors.border },
              ]}
            >
              <Text style={styles.avatarTextLarge}>{iniciales}</Text>
            </View>

            <Text variant="headlineSmall" style={[styles.nombreCliente, { color: colors.text }]}>
              {cliente.nombre}
            </Text>

            <Text variant="bodyMedium" style={{ color: colors.textSecondary, marginTop: 4 }}>
              🪪 ID: {cliente.numeroDocumento}  📞 {cliente.telefono}
            </Text>

            <Button
              mode="outlined"
              icon="pencil"
              textColor={colors.primary}
              style={{ marginTop: 14, borderRadius: 20, borderColor: colors.border }}
              onPress={() => setModalEditarVisible(true)}
            >
              Editar Perfil
            </Button>
          </Card.Content>
        </Card>

        {/* Banner de Alerta Rojo Stitch si el saldo supera el límite */}
        {limiteSuperado && (
          <View style={styles.bannerAlertaRojo}>
            <Text style={{ fontSize: 18 }}>⚠️</Text>
            <Text style={styles.bannerAlertaTexto}>
              ¡Atención! Saldo supera el límite establecido para este cliente. Por favor, regularice el estado de cuenta.
            </Text>
          </View>
        )}

        {/* Tarjeta ESTADO DE CRÉDITO Stitch */}
        <Card style={[styles.cardCredito, { backgroundColor: colors.card }]} mode="outlined">
          <Card.Content>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text variant="labelLarge" style={{ color: colors.textSecondary, fontWeight: 'bold', letterSpacing: 1 }}>
                ESTADO DE CRÉDITO
              </Text>

              <View
                style={{
                  backgroundColor: cliente.saldoActual < 0
                    ? (isDarkMode ? '#1b3320' : '#e8f5e9')
                    : limiteSuperado
                    ? (isDarkMode ? '#3b1c1c' : '#fde8e8')
                    : (isDarkMode ? '#1b3320' : '#e8f5e9'),
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 12,
                  borderColor: cliente.saldoActual < 0
                    ? (isDarkMode ? '#2e6b38' : '#c8e6c9')
                    : limiteSuperado
                    ? (isDarkMode ? '#7f2626' : '#f5c6c6')
                    : (isDarkMode ? '#2e6b38' : '#c8e6c9'),
                  borderWidth: 1,
                }}
              >
                <Text
                  style={{
                    color: cliente.saldoActual < 0
                      ? (isDarkMode ? '#81c784' : '#2e7d32')
                      : limiteSuperado
                      ? (isDarkMode ? '#ff8a80' : '#d32f2f')
                      : (isDarkMode ? '#81c784' : '#2e7d32'),
                    fontWeight: 'bold',
                    fontSize: 12,
                  }}
                >
                  {cliente.saldoActual < 0 ? '✨ Saldo a Favor' : `${porcentajeUtilizado}% Utilizado`}
                </Text>
              </View>
            </View>

            <View style={styles.rowCredito}>
              <View>
                <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                  {cliente.saldoActual < 0 ? 'Saldo a Favor' : 'Deuda Actual'}
                </Text>
                <Text
                  variant="headlineMedium"
                  style={{
                    color: cliente.saldoActual < 0 ? (isDarkMode ? '#81c784' : '#2e7d32') : '#ef5350',
                    fontWeight: 'bold',
                  }}
                >
                  {cliente.saldoActual < 0
                    ? `+$${Math.abs(cliente.saldoActual).toLocaleString()}`
                    : `$${(cliente.saldoActual ?? 0).toLocaleString()}`}
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                  Límite de Crédito
                </Text>
                <Text variant="headlineSmall" style={{ color: colors.text, fontWeight: 'bold' }}>
                  ${(limiteEfectivo ?? 0).toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Barra de Progreso de Crédito */}
            <ProgressBar
              progress={progresoBarra}
              color={limiteSuperado ? '#ef5350' : '#81c784'}
              style={{ height: 8, borderRadius: 4, marginTop: 10 }}
            />
          </Card.Content>
        </Card>

        {/* Botón Principal Morado Stitch: + Registrar Fiado o Pago */}
        <Button
          mode="contained"
          buttonColor={isDarkMode ? '#bb86fc' : '#6200ee'}
          textColor={isDarkMode ? '#000000' : '#ffffff'}
          icon="plus"
          onPress={() => setModalMovimientoVisible(true)}
          style={styles.btnRegistrarPrincipal}
          contentStyle={{ paddingVertical: 6 }}
        >
          Registrar Fiado o Pago
        </Button>

        {/* Encabezado Sección Historial de Transacciones Stitch */}
        <View style={styles.historialHeader}>
          <Text variant="titleMedium" style={{ color: colors.text, fontWeight: 'bold' }}>
            Historial de Transacciones
          </Text>
          <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
            Últimos movimientos
          </Text>
        </View>

        {/* Contenedor Unificado Estilo Stitch para Historial de Transacciones */}
        {historial.length === 0 ? (
          <Text variant="bodyMedium" style={{ color: colors.textSecondary, fontStyle: 'italic', marginVertical: 10 }}>
            Este cliente no tiene movimientos registrados.
          </Text>
        ) : (
          <Card
            style={[
              styles.cardHistorialGroup,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            mode="outlined"
          >
            <Card.Content style={{ paddingHorizontal: 0, paddingVertical: 4 }}>
              {historial.map((item, index) => {
                const esFiado = item.tipo === 'FIADO';
                const esPago = item.tipo === 'PAGO';
                const esAnulacion = item.tipo === 'ANULACION';
                const fechaTexto = formatearFechaRelativa(item.fechaCreacion);

                return (
                  <React.Fragment key={item.id}>
                    {index > 0 && <Divider style={{ backgroundColor: isDarkMode ? '#2c2c2c' : '#f0f0f0' }} />}

                    <View style={styles.movimientoRowStitch}>
                      {/* Caja de Icono Suave */}
                      <View
                        style={[
                          styles.iconBoxStitch,
                          {
                            backgroundColor: esFiado
                              ? '#fde8e8'
                              : esPago
                              ? '#e8f5e9'
                              : '#fff3e0',
                          },
                        ]}
                      >
                        <Text style={{ fontSize: 20 }}>{esFiado ? '🛒' : esPago ? '💵' : '⚠️'}</Text>
                      </View>

                      {/* Información Principal del Movimiento */}
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text
                            variant="titleSmall"
                            numberOfLines={1}
                            style={{ color: colors.text, fontWeight: 'bold', flex: 1, marginRight: 8 }}
                          >
                            {esFiado ? 'Fiado: ' : esPago ? 'Pago: ' : 'Anulado: '}
                            {item.descripcion || (esFiado ? 'Compra general' : esPago ? 'Abono a deuda' : 'Anulación')}
                          </Text>

                          <Text
                            variant="titleSmall"
                            style={{
                              color: esFiado ? '#ef5350' : esPago ? '#2e7d32' : '#ffb74d',
                              fontWeight: 'bold',
                              fontSize: 15,
                            }}
                          >
                            ${(item.monto ?? 0).toLocaleString()}
                          </Text>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <Text variant="bodySmall" style={{ color: colors.textSecondary, fontSize: 12 }}>
                            {fechaTexto}
                          </Text>

                          <View
                            style={[
                              styles.chipSyncStitch,
                              {
                                backgroundColor: item.estadoSincronizacion === 'SINCRONIZADO' ? '#e8f5e9' : '#eeeeee',
                              },
                            ]}
                          >
                            <Text
                              style={{
                                color: item.estadoSincronizacion === 'SINCRONIZADO' ? '#2e7d32' : '#666666',
                                fontSize: 10,
                                fontWeight: 'bold',
                              }}
                            >
                              {item.estadoSincronizacion}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Botón Anular / Eliminar */}
                      {!esAnulacion && (
                        <IconButton
                          icon="delete-outline"
                          iconColor={isDarkMode ? '#ff8a80' : '#d32f2f'}
                          size={20}
                          onPress={() => handleAbrirAnular(item)}
                          style={{ margin: 0 }}
                        />
                      )}
                    </View>
                  </React.Fragment>
                );
              })}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Modal Nuevo Movimiento */}
      <NuevoMovimientoModal
        visible={modalMovimientoVisible}
        onDismiss={() => setModalMovimientoVisible(false)}
        tiendaId={cliente.tiendaId}
        clienteId={cliente.id}
        nombreCliente={cliente.nombre}
        onSuccess={cargarDatos}
      />

      {/* Modal Editar Cliente */}
      {tienda && (
        <CrearClienteModal
          visible={modalEditarVisible}
          onDismiss={() => setModalEditarVisible(false)}
          tiendaId={tienda.id}
          clienteEditar={cliente}
          onSuccess={cargarDatos}
        />
      )}

      {/* Modal Anulación de Movimiento Cross-Platform (Web & Móvil) */}
      <Portal>
        <Modal
          visible={Boolean(movimientoAAnular)}
          onDismiss={() => setMovimientoAAnular(null)}
          contentContainerStyle={[
            styles.modalAnulacion,
            { backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff' },
          ]}
        >
          <Text variant="titleLarge" style={{ color: colors.text, fontWeight: 'bold', marginBottom: 8 }}>
            ⚠️ Anular Movimiento
          </Text>

          <Text variant="bodyMedium" style={{ color: colors.textSecondary, marginBottom: 14 }}>
            ¿Estás seguro de anular la transacción de{' '}
            <Text style={{ fontWeight: 'bold', color: '#ef5350' }}>
              ${(movimientoAAnular?.monto ?? 0).toLocaleString()}
            </Text>
            ? Escribe el motivo de la anulación:
          </Text>

          <TextInput
            label="Motivo de la anulación *"
            value={motivoAnulacionInput}
            onChangeText={(val) => {
              setMotivoAnulacionInput(val);
              setErrorAnulacion(null);
            }}
            textColor={colors.text}
            contentStyle={{ color: colors.text }}
            activeOutlineColor="#ef5350"
            outlineColor={colors.border}
            mode="outlined"
            style={{ backgroundColor: colors.inputBackground, marginBottom: 8 }}
            placeholder="Ej: Error en el monto digitado"
            placeholderTextColor={colors.textSecondary}
          />

          {errorAnulacion && (
            <HelperText type="error" visible={true}>
              {errorAnulacion}
            </HelperText>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
            <Button mode="outlined" onPress={() => setMovimientoAAnular(null)} style={{ borderRadius: 10 }}>
              Cancelar
            </Button>
            <Button
              mode="contained"
              buttonColor="#d32f2f"
              textColor="#ffffff"
              loading={anulando}
              disabled={anulando}
              onPress={handleConfirmarAnulacion}
              style={{ borderRadius: 10 }}
            >
              Anular
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 36,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  storeNameHeader: {
    color: '#6200ee',
    fontWeight: 'bold',
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  cardProfile: {
    borderRadius: 16,
    marginBottom: 16,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarTextLarge: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 24,
  },
  nombreCliente: {
    fontWeight: 'bold',
  },
  bannerAlertaRojo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fde8e8',
    borderColor: '#f5c6c6',
    borderWidth: 1,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  bannerAlertaTexto: {
    flex: 1,
    color: '#c62828',
    fontSize: 13,
    fontWeight: '600',
  },
  cardCredito: {
    borderRadius: 16,
    marginBottom: 16,
  },
  rowCredito: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 10,
    marginBottom: 6,
  },
  montoDeudaRojo: {
    color: '#ef5350',
    fontWeight: 'bold',
  },
  btnRegistrarPrincipal: {
    borderRadius: 14,
    marginBottom: 20,
    elevation: 3,
  },
  historialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHistorialGroup: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  movimientoRowStitch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconBoxStitch: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipSyncStitch: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  modalAnulacion: {
    padding: 20,
    margin: 20,
    borderRadius: 16,
  },
});
