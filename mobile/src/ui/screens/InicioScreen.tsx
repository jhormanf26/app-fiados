import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Chip, Divider, Button, ActivityIndicator } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { tiendaRepository } from '../../core/repositories/tiendaRepository';
import { clienteRepository } from '../../core/repositories/clienteRepository';
import { motorSincronizacion } from '../../core/sync/syncEngine';
import { Tienda, ResumenSincronizacion } from '../../core/types/database';

export const InicioScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [tienda, setTienda] = useState<Tienda | null>(null);
  const [deudaTotal, setDeudaTotal] = useState<number>(0);
  const [conteoDeudores, setConteoDeudores] = useState<number>(0);
  const [totalClientes, setTotalClientes] = useState<number>(0);
  const [cargando, setCargando] = useState<boolean>(true);
  const [refrescando, setRefrescando] = useState<boolean>(false);
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#bb86fc" />
        <Text style={{ marginTop: 10, color: '#aaa' }}>Cargando datos de la tienda...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefresh} tintColor="#bb86fc" />}
      >
        {/* Encabezado */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.titulo}>
            {tienda?.nombre}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitulo}>
            Propietario: {tienda?.nombrePropietario}
          </Text>
        </View>

        {/* Badges de Conexión y Cola */}
        <View style={styles.badgeRow}>
          <Chip
            icon={sincronizacion.estaEnLinea ? 'wifi' : 'wifi-off'}
            style={[
              styles.chip,
              { backgroundColor: sincronizacion.estaEnLinea ? '#1b5e20' : '#b71c1c' },
            ]}
          >
            {sincronizacion.estaEnLinea ? 'Online' : 'Offline'}
          </Chip>

          <Chip icon="tray-full" style={styles.chip}>
            Pendientes: {sincronizacion.pendientesCount}
          </Chip>
        </View>

        {/* Tarjeta Métricas Financieras */}
        <Card style={styles.cardPrincipal} mode="elevated">
          <Card.Content>
            <Text variant="bodyMedium" style={{ color: '#b0bec5' }}>
              Deuda Total por Cobrar
            </Text>
            <Text variant="displaySmall" style={styles.montoDeuda}>
              ${deudaTotal.toLocaleString()}
            </Text>
            <Divider style={styles.divider} />

            <View style={styles.metricsRow}>
              <View style={styles.metricCol}>
                <Text variant="bodySmall" style={{ color: '#aaa' }}>
                  Clientes Deudores
                </Text>
                <Text variant="titleMedium" style={{ color: '#ffb74d', fontWeight: 'bold' }}>
                  {conteoDeudores} de {totalClientes}
                </Text>
              </View>

              <View style={styles.metricCol}>
                <Text variant="bodySmall" style={{ color: '#aaa' }}>
                  Límite por Defecto
                </Text>
                <Text variant="titleMedium" style={{ color: '#81c784', fontWeight: 'bold' }}>
                  ${(tienda?.limiteCreditoPredeterminado ?? 100000).toLocaleString()}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Acciones Rápidas */}
        <Text variant="titleMedium" style={styles.seccionTitulo}>
          Acciones Rápidas
        </Text>

        <View style={styles.actionRow}>
          <Button
            mode="contained"
            buttonColor="#6200ee"
            icon="account-group"
            onPress={() => navigation.navigate('ClientesTab')}
            style={styles.actionBtn}
          >
            Ver Clientes
          </Button>

          <Button
            mode="contained"
            buttonColor="#03dac6"
            textColor="#000"
            icon="store-cog"
            onPress={() => navigation.navigate('ConfiguracionTab')}
            style={styles.actionBtn}
          >
            Ajustes
          </Button>
        </View>

        {/* Banner Informativo Offline */}
        <Card style={styles.cardInfo} mode="outlined">
          <Card.Content>
            <Text variant="titleSmall" style={{ color: '#81d4fa', fontWeight: 'bold' }}>
              ℹ️ Modo Offline Activo
            </Text>
            <Text variant="bodySmall" style={{ color: '#b0bec5', marginTop: 4, lineHeight: 18 }}>
              Todos los fiados y pagos registrados sin señal se almacenan localmente en tu teléfono y se sincronizan en cuanto te conectes a internet.
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
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
    padding: 20,
    paddingTop: 40,
  },
  header: {
    marginBottom: 12,
  },
  titulo: {
    color: '#bb86fc',
    fontWeight: 'bold',
  },
  subtitulo: {
    color: '#b0bec5',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    borderRadius: 20,
  },
  cardPrincipal: {
    backgroundColor: '#1e1e1e',
    marginBottom: 20,
  },
  montoDeuda: {
    color: '#ef5350',
    fontWeight: 'bold',
    marginVertical: 4,
  },
  divider: {
    marginVertical: 12,
    backgroundColor: '#333',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricCol: {
    flex: 1,
  },
  seccionTitulo: {
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 8,
  },
  cardInfo: {
    backgroundColor: '#0d2b3a',
    borderColor: '#0288d1',
  },
});
