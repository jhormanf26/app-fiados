import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import {
  Provider as PaperProvider,
  MD3DarkTheme,
  Text,
  Card,
  Chip,
  ActivityIndicator,
  Button,
  Divider,
  List,
  HelperText,
} from 'react-native-paper';
import { inicializarBaseDatos } from './src/core/database/db';
import { motorSincronizacion } from './src/core/sync/syncEngine';
import { tiendaRepository } from './src/core/repositories/tiendaRepository';
import { clienteRepository } from './src/core/repositories/clienteRepository';
import { movimientoRepository } from './src/core/repositories/movimientoRepository';
import { Tienda, Cliente, Movimiento, ResumenSincronizacion } from './src/core/types/database';

export default function App() {
  const [bdLista, setBdLista] = useState<boolean | null>(null);
  const [tienda, setTienda] = useState<Tienda | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [historial, setHistorial] = useState<Movimiento[]>([]);
  const [alertaLimite, setAlertaLimite] = useState<string | null>(null);
  const [resumenSincronizacion, setResumenSincronizacion] = useState<ResumenSincronizacion>({
    pendientesCount: 0,
    estaEnLinea: false,
  });

  useEffect(() => {
    async function prepararApp() {
      const estaBdOk = await inicializarBaseDatos();
      setBdLista(estaBdOk);
      if (estaBdOk) {
        await cargarDatosDemo();
      }
    }
    prepararApp();

    const desuscribir = motorSincronizacion.suscribir(async (estaEnLinea) => {
      const resumen = await motorSincronizacion.obtenerResumen();
      setResumenSincronizacion({ ...resumen, estaEnLinea });
    });

    return () => desuscribir();
  }, []);

  const cargarDatosDemo = async () => {
    // 1. Obtener o Crear Tienda Demo
    let tiendaActual = await tiendaRepository.obtenerTienda();
    if (!tiendaActual) {
      tiendaActual = await tiendaRepository.guardarTienda({
        nombre: 'Supermercado La Esperanza',
        nombrePropietario: 'Carlos Mendoza',
        documentoPropietario: '1098765432',
        telefono: '3001234567',
        correo: 'tienda@laesperanza.com',
        limiteCreditoPredeterminado: 100000,
      });
    }
    setTienda(tiendaActual);

    // 2. Obtener o Crear Cliente Demo
    const clientes = await clienteRepository.obtenerClientes(tiendaActual.id);
    let clienteActivo = clientes[0] ?? null;

    if (!clienteActivo) {
      clienteActivo = await clienteRepository.crearCliente(tiendaActual.id, {
        nombre: 'Juan Pérez',
        numeroDocumento: '123456789',
        telefono: '3159876543',
        correo: 'juan.perez@email.com',
        notificacionesAutorizadas: true,
        correoVerificado: true,
        limiteCreditoPersonalizado: 120000,
      });
    }
    setCliente(clienteActivo);

    // 3. Cargar Historial de Movimientos
    if (clienteActivo) {
      const txs = await movimientoRepository.obtenerHistorialCliente(clienteActivo.id);
      setHistorial(txs);
    }

    // 4. Actualizar Resumen de Sincronización
    const resumen = await motorSincronizacion.obtenerResumen();
    setResumenSincronizacion(resumen);
  };

  const handleAgregarFiado = async (monto: number) => {
    if (!tienda || !cliente) return;
    try {
      setAlertaLimite(null);
      const resultado = await movimientoRepository.agregarFiado(
        tienda.id,
        cliente.id,
        monto,
        `Compra de víveres ($${monto.toLocaleString()})`
      );

      if (resultado.limiteSuperado) {
        setAlertaLimite(
          `⚠️ ¡ALERTA! El nuevo saldo sobrepasa el límite de crédito ($${resultado.limiteEfectivo.toLocaleString()}).`
        );
      }

      await cargarDatosDemo();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleAgregarPago = async (monto: number) => {
    if (!tienda || !cliente) return;
    try {
      setAlertaLimite(null);
      await movimientoRepository.agregarPago(
        tienda.id,
        cliente.id,
        monto,
        `Abono a cuenta ($${monto.toLocaleString()})`
      );
      await cargarDatosDemo();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <PaperProvider theme={MD3DarkTheme}>
      <View style={styles.contenedor}>
        <ScrollView contentContainerStyle={styles.contenidoScroll}>
          {/* Encabezado */}
          <View style={styles.encabezado}>
            <Text variant="headlineMedium" style={styles.titulo}>
              {tienda ? tienda.nombre : 'Gestor Digital de Fiados'}
            </Text>
            <Text variant="bodyMedium" style={styles.subtitulo}>
              {tienda ? `Propietario: ${tienda.nombrePropietario}` : 'Inicializando...'}
            </Text>
          </View>

          {/* Insignias de Estado */}
          <View style={styles.filaChips}>
            <Chip
              icon={resumenSincronizacion.estaEnLinea ? 'wifi' : 'wifi-off'}
              style={[
                styles.chip,
                { backgroundColor: resumenSincronizacion.estaEnLinea ? '#1b5e20' : '#b71c1c' },
              ]}
            >
              {resumenSincronizacion.estaEnLinea ? 'En Línea' : 'Sin Internet'}
            </Chip>

            <Chip
              icon="database"
              style={[
                styles.chip,
                { backgroundColor: bdLista ? '#0d47a1' : '#e65100' },
              ]}
            >
              {bdLista ? 'SQLite Listo' : 'Iniciando BD'}
            </Chip>

            <Chip icon="tray-full" style={styles.chip}>
              Cola: {resumenSincronizacion.pendientesCount}
            </Chip>
          </View>

          {/* Tarjeta del Cliente */}
          {cliente && (
            <Card style={styles.tarjeta} mode="elevated">
              <Card.Content>
                <View style={styles.encabezadoCliente}>
                  <View>
                    <Text variant="titleMedium" style={styles.tituloTarjeta}>
                      {cliente.nombre}
                    </Text>
                    <Text variant="bodySmall" style={{ color: '#aaa' }}>
                      Doc: {cliente.numeroDocumento} | Tel: {cliente.telefono}
                    </Text>
                  </View>
                  <Chip icon="shield-check" style={{ backgroundColor: '#2e7d32' }}>
                    Verificado
                  </Chip>
                </View>

                <Divider style={styles.divisor} />

                <View style={styles.filaSaldo}>
                  <View>
                    <Text variant="bodySmall" style={{ color: '#aaa' }}>
                      Saldo Deuda Actual:
                    </Text>
                    <Text variant="headlineSmall" style={{ color: '#ef5350', fontWeight: 'bold' }}>
                      ${cliente.saldoActual.toLocaleString()}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text variant="bodySmall" style={{ color: '#aaa' }}>
                      Límite de Crédito:
                    </Text>
                    <Text variant="titleMedium" style={{ color: '#81c784' }}>
                      ${(cliente.limiteCreditoPersonalizado ?? tienda?.limiteCreditoPredeterminado ?? 100000).toLocaleString()}
                    </Text>
                  </View>
                </View>

                {alertaLimite && (
                  <HelperText type="error" visible={true} style={{ fontSize: 13, marginTop: 8 }}>
                    {alertaLimite}
                  </HelperText>
                )}

                <Divider style={styles.divisor} />

                {/* Botones de Acción */}
                <Text variant="labelLarge" style={{ marginBottom: 10, color: '#bb86fc' }}>
                  Acciones Rápidas (Prueba de Transacción Local):
                </Text>

                <View style={styles.filaBotones}>
                  <Button
                    mode="contained"
                    buttonColor="#c62828"
                    icon="plus-circle"
                    onPress={() => handleAgregarFiado(50000)}
                    style={styles.botonAccion}
                  >
                    + Fiado $50.000
                  </Button>

                  <Button
                    mode="contained"
                    buttonColor="#2e7d32"
                    icon="minus-circle"
                    onPress={() => handleAgregarPago(20000)}
                    style={styles.botonAccion}
                  >
                    - Pago $20.000
                  </Button>
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Historial Cronológico */}
          <Card style={styles.tarjeta} mode="elevated">
            <Card.Content>
              <Text variant="titleMedium" style={styles.tituloTarjeta}>
                Historial Cronológico de Movimientos
              </Text>
              <Divider style={styles.divisor} />

              {historial.length === 0 ? (
                <Text variant="bodyMedium" style={{ color: '#aaa', fontStyle: 'italic' }}>
                  No hay movimientos registrados para este cliente.
                </Text>
              ) : (
                historial.map((item) => (
                  <List.Item
                    key={item.id}
                    title={`${item.tipo === 'FIADO' ? '🛒 Fiado' : item.tipo === 'PAGO' ? '💵 Pago / Abono' : '⚠️ Anulación'}: $${item.monto.toLocaleString()}`}
                    description={`${item.descripcion ?? 'Sin descripción'} | ${new Date(item.fechaCreacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    right={() => (
                      <Chip
                        icon={item.estadoSincronizacion === 'SINCRONIZADO' ? 'check' : 'clock-outline'}
                        style={{
                          height: 30,
                          backgroundColor: item.estadoSincronizacion === 'SINCRONIZADO' ? '#1b5e20' : '#424242',
                        }}
                      >
                        {item.estadoSincronizacion}
                      </Chip>
                    )}
                    titleStyle={{
                      color: item.tipo === 'FIADO' ? '#ef5350' : item.tipo === 'PAGO' ? '#81c784' : '#ffb74d',
                      fontWeight: 'bold',
                    }}
                  />
                ))
              )}
            </Card.Content>
          </Card>
        </ScrollView>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#121212',
  },
  contenidoScroll: {
    padding: 20,
    paddingTop: 50,
  },
  encabezado: {
    marginBottom: 16,
  },
  titulo: {
    color: '#bb86fc',
    fontWeight: 'bold',
  },
  subtitulo: {
    color: '#b0bec5',
    marginTop: 2,
  },
  filaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    borderRadius: 20,
  },
  tarjeta: {
    marginBottom: 16,
    backgroundColor: '#1e1e1e',
  },
  tituloTarjeta: {
    color: '#ffffff',
    fontWeight: '600',
  },
  divisor: {
    marginVertical: 10,
    backgroundColor: '#333',
  },
  encabezadoCliente: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filaSaldo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  filaBotones: {
    flexDirection: 'row',
    gap: 10,
  },
  botonAccion: {
    flex: 1,
    borderRadius: 8,
  },
});
