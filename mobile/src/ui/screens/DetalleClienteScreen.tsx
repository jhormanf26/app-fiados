import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Divider, Chip, IconButton, ActivityIndicator, ProgressBar } from 'react-native-paper';
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
      {/* Encabezado Superior Stitch: Flecha atrás + Nombre Tienda + Synced */}
      <View style={[styles.topHeaderBar, { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' }]}>
        <IconButton
          icon="arrow-left"
          iconColor={colors.text}
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text variant="titleMedium" style={styles.storeNameHeader}>
          {tienda?.nombre || 'Supermercado La Esperanza'}
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
            <Text variant="labelLarge" style={{ color: colors.textSecondary, fontWeight: 'bold', letterSpacing: 1 }}>
              ESTADO DE CRÉDITO
            </Text>

            <View style={styles.rowCredito}>
              <View>
                <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                  Deuda Actual
                </Text>
                <Text variant="headlineMedium" style={styles.montoDeudaRojo}>
                  ${(cliente?.saldoActual ?? 0).toLocaleString()}
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
              style={{ height: 8, borderRadius: 4, marginVertical: 10 }}
            />

            <Text
              style={{
                color: limiteSuperado ? '#ef5350' : '#81c784',
                fontWeight: 'bold',
                fontSize: 13,
              }}
            >
              {porcentajeUtilizado}% Utilizado
            </Text>
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

        {/* Sección Historial de Transacciones */}
        <View style={styles.historialHeader}>
          <Text variant="titleMedium" style={{ color: colors.text, fontWeight: 'bold' }}>
            Historial de Transacciones
          </Text>
          <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
            Últimos movimientos
          </Text>
        </View>

        {historial.length === 0 ? (
          <Text variant="bodyMedium" style={{ color: colors.textSecondary, fontStyle: 'italic', marginVertical: 10 }}>
            Este cliente no tiene movimientos registrados.
          </Text>
        ) : (
          historial.map((item) => {
            const esFiado = item.tipo === 'FIADO';
            const esPago = item.tipo === 'PAGO';

            return (
              <Card
                key={item.id}
                style={[
                  styles.cardMovimiento,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                mode="outlined"
              >
                <Card.Content style={styles.movimientoContent}>
                  {/* Icon Box (Rojo para Fiado, Verde para Pago) */}
                  <View
                    style={[
                      styles.iconBox,
                      { backgroundColor: esFiado ? '#fde8e8' : esPago ? '#e8f5e9' : '#fff3e0' },
                    ]}
                  >
                    <Text style={{ fontSize: 20 }}>{esFiado ? '🛒' : esPago ? '💵' : '⚠️'}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text variant="titleSmall" style={{ color: colors.text, fontWeight: 'bold' }}>
                        {esFiado ? 'Fiado' : esPago ? 'Pago / Abono' : 'Anulación'}: {item.descripcion || 'General'}
                      </Text>
                      <Text
                        variant="titleSmall"
                        style={{
                          color: esFiado ? '#ef5350' : esPago ? '#2e7d32' : '#ffb74d',
                          fontWeight: 'bold',
                        }}
                      >
                        ${(item.monto ?? 0).toLocaleString()}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                        {new Date(item.fechaCreacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>

                      <Chip
                        style={{
                          height: 22,
                          backgroundColor: item.estadoSincronizacion === 'SINCRONIZADO' ? '#e8f5e9' : '#eeeeee',
                        }}
                        textStyle={{
                          color: item.estadoSincronizacion === 'SINCRONIZADO' ? '#2e7d32' : '#666666',
                          fontSize: 10,
                          fontWeight: 'bold',
                        }}
                      >
                        {item.estadoSincronizacion}
                      </Chip>
                    </View>
                  </View>

                  {item.tipo !== 'ANULACION' && (
                    <IconButton
                      icon="delete-outline"
                      iconColor="#ef5350"
                      size={20}
                      onPress={() => handleAnular(item)}
                    />
                  )}
                </Card.Content>
              </Card>
            );
          })
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
  cardMovimiento: {
    borderRadius: 14,
    marginBottom: 10,
  },
  movimientoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
