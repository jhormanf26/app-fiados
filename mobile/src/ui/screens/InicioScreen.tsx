import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Button, Divider, Chip, ActivityIndicator, IconButton, ProgressBar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { tiendaRepository } from '../../core/repositories/tiendaRepository';
import { clienteRepository } from '../../core/repositories/clienteRepository';
import { movimientoRepository, MovimientoConCliente, PeriodoFiltroCartera } from '../../core/repositories/movimientoRepository';
import { motorSincronizacion } from '../../core/sync/syncEngine';
import { Tienda, ResumenSincronizacion } from '../../core/types/database';
import { APP_VERSION } from '../../core/constants/version';
import { NuevoMovimientoModal } from '../modals/NuevoMovimientoModal';
import { useAppTheme } from '../theme/ThemeContext';

function formatearTiempoHace(isoString: string): string {
  try {
    const fecha = new Date(isoString);
    const ahora = new Date();
    const difMs = ahora.getTime() - fecha.getTime();
    const difMin = Math.floor(difMs / (1000 * 60));
    const difHoras = Math.floor(difMs / (1000 * 60 * 60));
    const difDias = Math.floor(difMs / (1000 * 60 * 60 * 24));

    if (difMin < 1) return 'Hace un momento';
    if (difMin < 60) return `Hace ${difMin} min`;
    if (difHoras < 24) return `Hace ${difHoras} hr${difHoras > 1 ? 's' : ''}`;
    if (difDias === 1) return 'Ayer';
    return `Hace ${difDias} días`;
  } catch (e) {
    return 'Reciente';
  }
}

export const InicioScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { isDarkMode, colors } = useAppTheme();
  const [tienda, setTienda] = useState<Tienda | null>(null);
  const [deudaTotal, setDeudaTotal] = useState<number>(0);
  const [totalFiado, setTotalFiado] = useState<number>(0);
  const [totalRecuperado, setTotalRecuperado] = useState<number>(0);
  const [periodoCartera, setPeriodoCartera] = useState<PeriodoFiltroCartera>('SIEMPRE');
  const [conteoDeudores, setConteoDeudores] = useState<number>(0);
  const [totalClientes, setTotalClientes] = useState<number>(0);
  const [movimientosDelDia, setMovimientosDelDia] = useState<MovimientoConCliente[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [refrescando, setRefrescando] = useState<boolean>(false);
  const [modalMovimientoVisible, setModalMovimientoVisible] = useState<boolean>(false);
  const [tipoMovimientoInicial, setTipoMovimientoInicial] = useState<'FIADO' | 'PAGO'>('FIADO');

  const handleAbrirMovimiento = (tipo: 'FIADO' | 'PAGO') => {
    setTipoMovimientoInicial(tipo);
    setModalMovimientoVisible(true);
  };

  const cambiarPeriodoCartera = async (nuevoPeriodo: PeriodoFiltroCartera) => {
    setPeriodoCartera(nuevoPeriodo);
    if (tienda) {
      const cartera = await movimientoRepository.obtenerResumenCartera(tienda.id, nuevoPeriodo);
      setTotalFiado(cartera.totalFiado);
      setTotalRecuperado(cartera.totalRecuperado);
    }
  };

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

      const sumaDeudas = clientes.reduce((acc, c) => acc + (c.saldoActual > 0 ? c.saldoActual : 0), 0);
      setDeudaTotal(sumaDeudas);

      // Cargar Resumen de Cartera (Total Fiado vs Total Recuperado en Pagos)
      const cartera = await movimientoRepository.obtenerResumenCartera(t.id, periodoCartera);
      setTotalFiado(cartera.totalFiado);
      setTotalRecuperado(cartera.totalRecuperado);

      // Cargar Movimientos del Día para el gráfico / lista reciente Stitch
      const recientes = await movimientoRepository.obtenerMovimientosDelDia(t.id);
      setMovimientosDelDia(recientes);

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

  const handleSincronizarManual = async () => {
    setRefrescando(true);
    try {
      const res = await motorSincronizacion.dispararSincronizacion();
      Alert.alert(res.exito ? '🔄 Sincronización' : '⚠️ Modo Offline', res.mensaje);
    } catch (e) {
      console.warn('Error al sincronizar:', e);
    } finally {
      await cargarDatos();
      setRefrescando(false);
    }
  };

  const onRefresh = () => {
    handleSincronizarManual();
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
      {/* Encabezado Superior FiaYa */}
      <View style={[styles.topHeaderBar, { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSincronizarManual}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <IconButton
            icon="sync"
            iconColor={isDarkMode ? '#bb86fc' : '#6200ee'}
            size={22}
            style={{ margin: 0 }}
          />
          <Text variant="titleMedium" style={styles.brandHeaderTitle}>
            FiaYa
          </Text>
        </TouchableOpacity>

        <Chip
          icon="check-circle"
          onPress={handleSincronizarManual}
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

        {/* Tarjeta Ejecutiva Hero: Deuda Total por Cobrar */}
        <Card style={[styles.cardHeroTotal, { backgroundColor: colors.card, borderColor: colors.border }]} mode="outlined">
          <Card.Content style={{ paddingVertical: 22, alignItems: 'center' }}>
            <Text variant="titleMedium" style={{ color: colors.textSecondary, fontWeight: '600', marginBottom: 2 }}>
              Deuda Total por Cobrar
            </Text>

            <Text variant="displayMedium" style={styles.montoTotalRojoHero}>
              ${(deudaTotal ?? 0).toLocaleString()}
            </Text>

            <Text variant="bodySmall" style={{ color: colors.textSecondary, marginTop: 4 }}>
              Actualizado en tiempo real • {conteoDeudores} de {totalClientes} Clientes Deudores
            </Text>
          </Card.Content>
        </Card>

        {/* Botones de Acción Destacados Lado a Lado: Nuevo Fiado vs Registrar Pago */}
        <View style={styles.actionRowHero}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleAbrirMovimiento('FIADO')}
            style={[styles.btnActionCustom, { backgroundColor: '#0b4f37' }]}
          >
            <IconButton icon="cart-plus" iconColor="#ffffff" size={26} style={{ margin: 0 }} />
            <Text style={styles.btnActionCustomText}>Nuevo Fiado</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleAbrirMovimiento('PAGO')}
            style={[styles.btnActionCustom, { backgroundColor: '#2c4d75' }]}
          >
            <IconButton icon="cash-plus" iconColor="#ffffff" size={26} style={{ margin: 0 }} />
            <Text style={styles.btnActionCustomText}>Registrar Pago</Text>
          </TouchableOpacity>
        </View>

        {/* Tarjeta RESUMEN DE CARTERA (Interactivo con Selector de Periodo) */}
        <Card style={[styles.cardTotal, { backgroundColor: colors.card, borderColor: colors.border }]} mode="outlined">
          <Card.Content style={{ paddingVertical: 18 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text variant="labelLarge" style={{ color: colors.textSecondary, fontWeight: 'bold', letterSpacing: 1 }}>
                RESUMEN DE CARTERA
              </Text>

              <Chip
                icon="percent"
                style={{ backgroundColor: isDarkMode ? '#1b3b1c' : '#e8f5e9' }}
                textStyle={{ color: '#2e7d32', fontWeight: 'bold', fontSize: 11 }}
              >
                {totalFiado > 0 ? `${Math.round((totalRecuperado / totalFiado) * 100)}% Recuperado` : '0%'}
              </Chip>
            </View>

            {/* Selector Interactivo de Periodo Temporal */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6, paddingBottom: 14 }}
            >
              {[
                { id: 'DIA', label: 'Hoy' },
                { id: 'SEMANA', label: '7 Días' },
                { id: '15DIAS', label: '15 Días' },
                { id: 'MES', label: '30 Días' },
                { id: 'SIEMPRE', label: 'Siempre' },
              ].map((item) => {
                const esActivo = periodoCartera === item.id;
                return (
                  <Chip
                    key={item.id}
                    selected={esActivo}
                    onPress={() => cambiarPeriodoCartera(item.id as PeriodoFiltroCartera)}
                    style={{
                      backgroundColor: esActivo
                        ? (isDarkMode ? '#bb86fc' : '#6200ee')
                        : (isDarkMode ? '#2c2c2c' : '#f0f0f0'),
                      height: 32,
                    }}
                    textStyle={{
                      color: esActivo ? (isDarkMode ? '#000000' : '#ffffff') : colors.text,
                      fontWeight: esActivo ? 'bold' : '500',
                      fontSize: 11,
                    }}
                  >
                    {item.label}
                  </Chip>
                );
              })}
            </ScrollView>

            {/* Fila 1: Total Fiado */}
            <View style={styles.carteraItem}>
              <View style={styles.carteraHeaderRow}>
                <Text variant="bodyMedium" style={{ color: colors.text, fontWeight: '500' }}>
                  Total Fiado ({periodoCartera === 'DIA' ? 'Hoy' : periodoCartera === 'SEMANA' ? '7 Días' : periodoCartera === '15DIAS' ? '15 Días' : periodoCartera === 'MES' ? '30 Días' : 'Histórico'})
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
                  Total Recuperado ({periodoCartera === 'DIA' ? 'Hoy' : periodoCartera === 'SEMANA' ? '7 Días' : periodoCartera === '15DIAS' ? '15 Días' : periodoCartera === 'MES' ? '30 Días' : 'Histórico'})
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

        {/* Tarjeta MOVIMIENTOS DEL DÍA (NUEVO STITCH MOCKUP) */}
        <Card style={[styles.cardTotal, { backgroundColor: colors.card, borderColor: colors.border }]} mode="outlined">
          <Card.Content style={{ paddingVertical: 18, paddingHorizontal: 16 }}>
            <Text variant="labelLarge" style={{ color: colors.textSecondary, fontWeight: 'bold', letterSpacing: 1, marginBottom: 12 }}>
              MOVIMIENTOS DEL DÍA
            </Text>

            {movimientosDelDia.length === 0 ? (
              <Text variant="bodyMedium" style={{ color: colors.textSecondary, fontStyle: 'italic', marginVertical: 6 }}>
                No hay movimientos registrados hoy aún.
              </Text>
            ) : (
              movimientosDelDia.map((mov, index) => {
                const esFiado = mov.tipo === 'FIADO';
                const esPago = mov.tipo === 'PAGO';
                const tiempoHace = formatearTiempoHace(mov.fechaCreacion);

                return (
                  <React.Fragment key={mov.id}>
                    {index > 0 && <Divider style={{ marginVertical: 10, backgroundColor: isDarkMode ? '#2c2c2c' : '#f0f0f0' }} />}

                    <View style={styles.movimientoDiaRow}>
                      {/* Icon Box */}
                      <View
                        style={[
                          styles.iconBoxDia,
                          { backgroundColor: esFiado ? '#fde8e8' : esPago ? '#e8f5e9' : '#fff3e0' },
                        ]}
                      >
                        <Text style={{ fontSize: 18 }}>{esFiado ? '🛒' : esPago ? '💵' : '⚠️'}</Text>
                      </View>

                      {/* Nombre Cliente + Tiempo */}
                      <View style={{ flex: 1 }}>
                        <Text variant="titleSmall" style={{ color: colors.text, fontWeight: 'bold' }}>
                          {mov.nombreCliente}
                        </Text>
                        <Text variant="bodySmall" style={{ color: colors.textSecondary, marginTop: 2 }}>
                          {tiempoHace}
                        </Text>
                      </View>

                      {/* Monto + Badge Sincronización */}
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text
                          variant="titleSmall"
                          style={{
                            color: esFiado ? '#ef5350' : esPago ? '#2e7d32' : '#ffb74d',
                            fontWeight: 'bold',
                            fontSize: 15,
                          }}
                        >
                          {esFiado ? `-$${(mov.monto ?? 0).toLocaleString()}` : `+$${(mov.monto ?? 0).toLocaleString()}`}
                        </Text>

                        <View
                          style={[
                            styles.syncPillDia,
                            {
                              backgroundColor: mov.estadoSincronizacion === 'SINCRONIZADO' ? '#e8f5e9' : '#fde8e8',
                            },
                          ]}
                        >
                          <Text
                            style={{
                              color: mov.estadoSincronizacion === 'SINCRONIZADO' ? '#2e7d32' : '#c62828',
                              fontSize: 10,
                              fontWeight: 'bold',
                            }}
                          >
                            {mov.estadoSincronizacion === 'SINCRONIZADO' ? 'Sincronizado' : 'Pendiente'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </React.Fragment>
                );
              })
            )}
          </Card.Content>
        </Card>

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
          tipoInicial={tipoMovimientoInicial}
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
  brandHeaderTitle: {
    color: '#6200ee',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 2,
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
  movimientoDiaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  iconBoxDia: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncPillDia: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  cardHeroTotal: {
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
  },
  montoTotalRojoHero: {
    color: '#c62828',
    fontWeight: 'bold',
    fontSize: 38,
    marginVertical: 4,
  },
  actionRowHero: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  btnActionCustom: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  btnActionCustomText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: -2,
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
