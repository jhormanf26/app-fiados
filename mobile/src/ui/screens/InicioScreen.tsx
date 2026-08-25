import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Divider, Chip, ActivityIndicator, IconButton, ProgressBar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { tiendaRepository } from '../../core/repositories/tiendaRepository';
import { clienteRepository } from '../../core/repositories/clienteRepository';
import { movimientoRepository } from '../../core/repositories/movimientoRepository';
import { motorSincronizacion } from '../../core/sync/syncEngine';
import { Tienda, ResumenSincronizacion } from '../../core/types/database';
import { APP_VERSION } from '../../core/constants/version';
import { NuevoMovimientoModal } from '../modals/NuevoMovimientoModal';
import { useAppTheme } from '../theme/ThemeContext';

export const InicioScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { isDarkMode, colors } = useAppTheme();
  const [tienda, setTienda] = useState<Tienda | null>(null);
  const [deudaTotal, setDeudaTotal] = useState<number>(0);
  const [totalFiado, setTotalFiado] = useState<number>(0);
  const [totalRecuperado, setTotalRecuperado] = useState<number>(0);
  const [conteoDeudores, setConteoDeudores] = useState<number>(0);
  const [totalClientes, setTotalClientes] = useState<number>(0);
  const [cargando, setCargando] = useState<boolean>(true);
  const [refrescando, setRefrescando] = useState<boolean>(false);
  const [modalMovimientoVisible, setModalMovimientoVisible] = useState<boolean>(false);

  const [sincronizacion, setSincronizacion] = useState<ResumenSincronizacion>({
    pendientesCount: 0,
    estaEnLinea: false,
  });

  const cargarDatos = async () => {
    try {
      let t = await tiendaRepository.obtenerTienda();
      if (!t) {
        t = await tiendaRepository.guardarTienda({
          nombre: 'Supermercado La Esperanza',
          nombrePropietario: 'Carlos Mendoza',
          documentoPropietario: '1098765432',
          telefono: '3001234567',
          correo: 'tienda@laesperanza.com',
          limiteCreditoPredeterminado: 100000,
        });
      }
      setTienda(t);

      const clientes = await clienteRepository.obtenerClientes(t.id);
      setTotalClientes(clientes.length);

      const deudores = clientes.filter((c) => c.saldoActual > 0);
      setConteoDeudores(deudores.length);

      const sumaDeudas = clientes.reduce((acc, c) => acc + c.saldoActual, 0);
      setDeudaTotal(sumaDeudas);

      // Cargar Resumen de Cartera (Total Fiado vs Total Recuperado en Pagos)
      const cartera = await movimientoRepository.obtenerResumenCartera(t.id);
      setTotalFiado(cartera.totalFiado);
      setTotalRecuperado(cartera.totalRecuperado);

      const resSync = await motorSincronizacion.obtenerResumen();
      setSincronizacion(resSync);
    } catch (err) {
      console.error('Error al cargar datos del inicio:', err);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [])
  );

  useEffect(() => {
    const desuscribir = motorSincronizacion.suscribir(async (estaEnLinea) => {
      const res = await motorSincronizacion.obtenerResumen();
      setSincronizacion({ ...res, estaEnLinea });
    });
    return () => desuscribir();
  }, []);

  const onRefresh = () => {
    setRefrescando(true);
    cargarDatos();
  };

  if (cargando) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10, color: colors.textSecondary }}>Cargando datos de la tienda...</Text>
      </View>
    );
  }

  // Cálculos proporcionales de las barras de progreso del Resumen de Cartera
  const maxBase = Math.max(totalFiado, totalRecuperado, 1);
  const progresoFiado = Math.min(totalFiado / maxBase, 1);
  const progresoRecuperado = Math.min(totalRecuperado / maxBase, 1);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Encabezado Superior Stitch */}
      <View style={[styles.topHeaderBar, { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' }]}>
        <IconButton
          icon="sync"
          iconColor={isDarkMode ? '#bb86fc' : '#6200ee'}
          size={22}
          onPress={cargarDatos}
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Saludo Propietario */}
        <Text variant="headlineMedium" style={[styles.greetingText, { color: colors.text }]}>
          Hola, {tienda?.nombrePropietario || 'Carlos Mendoza'}
        </Text>

        {/* Chips de Estado Stitch */}
        <View style={styles.badgeRow}>
          <Chip
            icon={sincronizacion.estaEnLinea ? 'wifi' : 'wifi-off'}
            style={{
              backgroundColor: sincronizacion.estaEnLinea ? '#e8f5e9' : '#fde8e8',
            }}
            textStyle={{
              color: sincronizacion.estaEnLinea ? '#2e7d32' : '#c62828',
              fontWeight: 'bold',
              fontSize: 12,
            }}
          >
            {sincronizacion.estaEnLinea ? 'Online' : 'Offline'}
          </Chip>

          <Chip
            icon="tray-full"
            style={{ backgroundColor: sincronizacion.pendientesCount > 0 ? '#fff3e0' : '#eeeeee' }}
            textStyle={{ color: sincronizacion.pendientesCount > 0 ? '#e65100' : '#666666', fontWeight: 'bold', fontSize: 12 }}
          >
            Pendientes: {sincronizacion.pendientesCount}
          </Chip>

          <Chip
            icon="tag-outline"
            style={{ backgroundColor: isDarkMode ? '#2c2c2c' : '#f0f0f0' }}
            textStyle={{ color: colors.textSecondary, fontSize: 12 }}
          >
            v{APP_VERSION}
          </Chip>
        </View>

        {/* Tarjeta Ejecutiva Financiera TOTAL POR COBRAR */}
        <Card style={[styles.cardTotal, { backgroundColor: colors.card, borderColor: colors.border }]} mode="outlined">
          <Card.Content style={{ paddingVertical: 18 }}>
            <Text variant="labelLarge" style={{ color: colors.textSecondary, fontWeight: 'bold', letterSpacing: 1 }}>
              TOTAL POR COBRAR
            </Text>

            <Text variant="displayMedium" style={styles.montoTotalRojo}>
              ${(deudaTotal ?? 0).toLocaleString()}
            </Text>

            <Divider style={styles.cardDivider} />

            <View style={styles.metricRow}>
              <Text variant="bodyMedium" style={{ color: colors.text, fontWeight: '500' }}>
                👥 {conteoDeudores} de {totalClientes} Clientes Deudores
              </Text>
            </View>

            <View style={[styles.metricRow, { marginTop: 6 }]}>
              <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
                ⚠️ Límite sugerido
              </Text>

              <Text variant="titleMedium" style={{ color: colors.text, fontWeight: 'bold' }}>
                ${((tienda?.limiteCreditoPredeterminado || 100000) ?? 0).toLocaleString()}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Tarjeta RESUMEN DE CARTERA (Total Fiado vs Total Recuperado) */}
        <Card style={[styles.cardTotal, { backgroundColor: colors.card, borderColor: colors.border }]} mode="outlined">
          <Card.Content style={{ paddingVertical: 18 }}>
            <Text variant="labelLarge" style={{ color: colors.textSecondary, fontWeight: 'bold', letterSpacing: 1, marginBottom: 12 }}>
              RESUMEN DE CARTERA
            </Text>

            {/* Fila 1: Total Fiado */}
            <View style={styles.carteraItem}>
              <View style={styles.carteraHeaderRow}>
                <Text variant="bodyMedium" style={{ color: colors.text, fontWeight: '500' }}>
                  Total Fiado
                </Text>
                <Text variant="titleMedium" style={{ color: '#ef5350', fontWeight: 'bold' }}>
                  ${(totalFiado ?? 0).toLocaleString()}
                </Text>
              </View>
              <ProgressBar
                progress={progresoFiado}
                color="#ef5350"
                style={{ height: 8, borderRadius: 4, marginTop: 4, backgroundColor: isDarkMode ? '#3b1c1c' : '#fde8e8' }}
              />
            </View>

            {/* Fila 2: Total Recuperado */}
            <View style={[styles.carteraItem, { marginTop: 14 }]}>
              <View style={styles.carteraHeaderRow}>
                <Text variant="bodyMedium" style={{ color: colors.text, fontWeight: '500' }}>
                  Total Recuperado
                </Text>
                <Text variant="titleMedium" style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                  ${(totalRecuperado ?? 0).toLocaleString()}
                </Text>
              </View>
              <ProgressBar
                progress={progresoRecuperado}
                color="#2e7d32"
                style={{ height: 8, borderRadius: 4, marginTop: 4, backgroundColor: isDarkMode ? '#1b3b1c' : '#e8f5e9' }}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Botones de Acción Lado a Lado */}
        <View style={styles.btnRow}>
          <Button
            mode="contained"
            buttonColor={isDarkMode ? '#bb86fc' : '#6200ee'}
            textColor={isDarkMode ? '#000000' : '#ffffff'}
            icon="account-group"
            onPress={() => navigation.navigate('ClientesTab')}
            style={styles.btnHalf}
            contentStyle={{ paddingVertical: 4 }}
          >
            Ver Clientes
          </Button>

          <Button
            mode="outlined"
            textColor={colors.text}
            icon="cog-outline"
            onPress={() => navigation.navigate('ConfiguracionTab')}
            style={[styles.btnHalf, { borderColor: colors.border }]}
            contentStyle={{ paddingVertical: 4 }}
          >
            Ajustes
          </Button>
        </View>

        {/* Botón Principal Completo: + Registrar Movimiento */}
        <Button
          mode="contained"
          buttonColor={isDarkMode ? '#bb86fc' : '#6200ee'}
          textColor={isDarkMode ? '#000000' : '#ffffff'}
          icon="plus"
          onPress={() => setModalMovimientoVisible(true)}
          style={styles.btnRegistrarMovimiento}
          contentStyle={{ paddingVertical: 8 }}
        >
          Registrar Movimiento
        </Button>

        {/* Banner Informativo Offline */}
        <View style={styles.bannerOffline}>
          <Text style={{ fontSize: 20 }}>🔄</Text>
          <Text style={styles.bannerOfflineTexto}>
            Operaciones offline se sincronizarán automáticamente al reconectarse a internet.
          </Text>
        </View>
      </ScrollView>

      {/* Modal para Registrar Movimiento desde el Inicio */}
      {tienda && (
        <NuevoMovimientoModal
          visible={modalMovimientoVisible}
          onDismiss={() => setModalMovimientoVisible(false)}
          tiendaId={tienda.id}
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
  greetingText: {
    fontWeight: 'bold',
    marginBottom: 12,
    fontSize: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  cardTotal: {
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  montoTotalRojo: {
    color: '#c62828',
    fontWeight: 'bold',
    marginVertical: 6,
  },
  cardDivider: {
    marginVertical: 10,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  carteraItem: {
    marginVertical: 2,
  },
  carteraHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  btnHalf: {
    flex: 1,
    borderRadius: 12,
  },
  btnRegistrarMovimiento: {
    borderRadius: 14,
    marginBottom: 16,
    elevation: 3,
  },
  bannerOffline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0,0,0,0.04)',
    padding: 14,
    borderRadius: 12,
  },
  bannerOfflineTexto: {
    flex: 1,
    color: '#666666',
    fontSize: 12,
    lineHeight: 16,
  },
});
