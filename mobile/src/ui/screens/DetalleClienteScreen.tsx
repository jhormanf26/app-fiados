import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Divider, Chip, List, IconButton, ActivityIndicator } from 'react-native-paper';
import { clienteRepository } from '../../core/repositories/clienteRepository';
import { movimientoRepository } from '../../core/repositories/movimientoRepository';
import { Cliente, Movimiento } from '../../core/types/database';
import { NuevoMovimientoModal } from '../modals/NuevoMovimientoModal';

export const DetalleClienteScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { clienteId } = route.params;
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [limiteEfectivo, setLimiteEfectivo] = useState<number>(100000);
  const [historial, setHistorial] = useState<Movimiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const cargarDatos = useCallback(async () => {
    try {
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

  const handleAnular = (movimiento: Movimiento) => {
    if (movimiento.tipo === 'ANULACION') return;

    Alert.prompt(
      'Anular Movimiento',
      `¿Estás seguro de anular este movimiento de $${movimiento.monto.toLocaleString()}? Escribe el motivo de la anulación:`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Anular',
          style: 'destructive',
          onPress: async (motivo?: string) => {
            if (!motivo || !motivo.trim()) {
              Alert.alert('Error', 'Debes escribir un motivo para anular.');
              return;
            }
            try {
              await movimientoRepository.anularMovimiento(movimiento.id, motivo.trim());
              await cargarDatos();
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  if (cargando || !cliente) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#bb86fc" />
      </View>
    );
  }

  const limiteSuperado = cliente.saldoActual > limiteEfectivo;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header perfil */}
        <Card style={styles.cardInfo} mode="elevated">
          <Card.Content>
            <View style={styles.headerRow}>
              <View>
                <Text variant="headlineSmall" style={styles.nombre}>
                  {cliente.nombre}
                </Text>
                <Text variant="bodyMedium" style={styles.subtext}>
                  Documento: {cliente.numeroDocumento}
                </Text>
                <Text variant="bodyMedium" style={styles.subtext}>
                  Teléfono: {cliente.telefono}
                </Text>
                {cliente.correo && (
                  <Text variant="bodySmall" style={{ color: '#aaa', marginTop: 2 }}>
                    Correo: {cliente.correo}
                  </Text>
                )}
              </View>

              <Chip
                icon={cliente.notificacionesAutorizadas ? 'bell-check' : 'bell-off'}
                style={[
                  styles.chipNotif,
                  { backgroundColor: cliente.notificacionesAutorizadas ? '#1b5e20' : '#424242' },
                ]}
              >
                {cliente.notificacionesAutorizadas ? 'Notif. OK' : 'Sin Notif.'}
              </Chip>
            </View>

            <Divider style={styles.divider} />

            {/* Fila Saldos */}
            <View style={styles.saldosRow}>
              <View>
                <Text variant="bodySmall" style={{ color: '#aaa' }}>
                  Saldo Deuda Actual:
                </Text>
                <Text variant="headlineMedium" style={styles.montoDeuda}>
                  ${cliente.saldoActual.toLocaleString()}
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text variant="bodySmall" style={{ color: '#aaa' }}>
                  Límite de Crédito:
                </Text>
                <Text variant="titleMedium" style={{ color: '#81c784', fontWeight: 'bold' }}>
                  ${limiteEfectivo.toLocaleString()}
                </Text>
              </View>
            </View>

            {limiteSuperado && (
              <View style={styles.alertaContainer}>
                <Text style={styles.alertaTexto}>
                  ⚠️ ¡Atención! El saldo actual supera el límite de crédito configurado.
                </Text>
              </View>
            )}

            <Divider style={styles.divider} />

            {/* Botón de Registro de Movimientos */}
            <Button
              mode="contained"
              buttonColor="#6200ee"
              icon="plus-circle"
              onPress={() => setModalVisible(true)}
              style={styles.btnMovimiento}
            >
              Registrar Fiado o Pago
            </Button>
          </Card.Content>
        </Card>

        {/* Lista Historial */}
        <Text variant="titleMedium" style={styles.seccionTitulo}>
          Historial Cronológico de Movimientos
        </Text>

        {historial.length === 0 ? (
          <Text variant="bodyMedium" style={{ color: '#aaa', fontStyle: 'italic', marginHorizontal: 4 }}>
            Este cliente no tiene movimientos registrados.
          </Text>
        ) : (
          historial.map((item) => {
            const esFiado = item.tipo === 'FIADO';
            const esPago = item.tipo === 'PAGO';

            return (
              <Card key={item.id} style={styles.cardItem} mode="outlined">
                <Card.Content style={styles.itemContent}>
                  <View style={{ flex: 1 }}>
                    <Text
                      variant="titleSmall"
                      style={{
                        color: esFiado ? '#ef5350' : esPago ? '#81c784' : '#ffb74d',
                        fontWeight: 'bold',
                      }}
                    >
                      {esFiado ? '🛒 Fiado' : esPago ? '💵 Pago / Abono' : '⚠️ Anulación'}: ${item.monto.toLocaleString()}
                    </Text>
                    <Text variant="bodySmall" style={{ color: '#ccc', marginTop: 2 }}>
                      {item.descripcion ?? 'Sin descripción'}
                    </Text>
                    {item.motivoAnulacion && (
                      <Text variant="bodySmall" style={{ color: '#ffb74d', marginTop: 2, fontStyle: 'italic' }}>
                        Motivo anulación: {item.motivoAnulacion}
                      </Text>
                    )}
                    <Text variant="bodySmall" style={{ color: '#777', marginTop: 4 }}>
                      {new Date(item.fechaCreacion).toLocaleString()}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Chip
                      icon={item.estadoSincronizacion === 'SINCRONIZADO' ? 'check' : 'clock-outline'}
                      style={{
                        height: 28,
                        backgroundColor: item.estadoSincronizacion === 'SINCRONIZADO' ? '#1b5e20' : '#333',
                      }}
                    >
                      {item.estadoSincronizacion}
                    </Chip>

                    {item.tipo !== 'ANULACION' && (
                      <IconButton
                        icon="delete-outline"
                        iconColor="#ef5350"
                        size={20}
                        onPress={() => handleAnular(item)}
                      />
                    )}
                  </View>
                </Card.Content>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Modal Nuevo Movimiento */}
      <NuevoMovimientoModal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        tiendaId={cliente.tiendaId}
        clienteId={cliente.id}
        nombreCliente={cliente.nombre}
        onSuccess={cargarDatos}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  center: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 40,
  },
  cardInfo: {
    backgroundColor: '#1e1e1e',
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nombre: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  subtext: {
    color: '#b0bec5',
    marginTop: 2,
  },
  chipNotif: {
    borderRadius: 16,
  },
  divider: {
    marginVertical: 12,
    backgroundColor: '#333',
  },
  saldosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  montoDeuda: {
    color: '#ef5350',
    fontWeight: 'bold',
  },
  alertaContainer: {
    backgroundColor: '#3b1c1c',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  alertaTexto: {
    color: '#ffb74d',
    fontSize: 13,
  },
  btnMovimiento: {
    borderRadius: 8,
    marginTop: 4,
  },
  seccionTitulo: {
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  cardItem: {
    backgroundColor: '#1e1e1e',
    marginBottom: 10,
    borderColor: '#333',
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
