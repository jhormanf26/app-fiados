import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, TextInput, Button, Card, Divider, ActivityIndicator, IconButton, Chip } from 'react-native-paper';
import { clienteRepository } from '../../core/repositories/clienteRepository';
import { movimientoRepository } from '../../core/repositories/movimientoRepository';
import { tiendaRepository } from '../../core/repositories/tiendaRepository';
import { Cliente, Movimiento, Tienda } from '../../core/types/database';
import { useAppTheme } from '../theme/ThemeContext';

function formatearUltimaSincronizacion(isoString?: string): string {
  if (!isoString) return 'Recién actualizado';
  try {
    const fecha = new Date(isoString);
    const ahora = new Date();
    const difMs = ahora.getTime() - fecha.getTime();
    const difMin = Math.floor(difMs / (1000 * 60));

    if (difMin < 1) return 'Hace un momento';
    if (difMin < 60) return `Hace ${difMin} min`;
    return `${fecha.toLocaleDateString()} ${fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch (e) {
    return 'Recién actualizado';
  }
}

export const ConsultaClienteScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { isDarkMode, colors } = useAppTheme();

  const [documento, setDocumento] = useState('');
  const [cargando, setCargando] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [clienteEncontrado, setClienteEncontrado] = useState<Cliente | null>(null);
  const [tiendaCliente, setTiendaCliente] = useState<Tienda | null>(null);
  const [historialCliente, setHistorialCliente] = useState<Movimiento[]>([]);
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleConsultar = async () => {
    if (!documento.trim()) {
      setErrorText('Por favor ingresa tu número de documento.');
      return;
    }

    setCargando(true);
    setErrorText(null);
    setBuscado(true);
    setClienteEncontrado(null);

    try {
      // 1. Obtener Tienda Activa
      const t = await tiendaRepository.obtenerTienda();
      setTiendaCliente(t);

      if (t) {
        // 2. Buscar Cliente por Documento
        const clientes = await clienteRepository.obtenerClientes(t.id, documento.trim());
        const coincidencia = clientes.find(
          (c) => c.numeroDocumento.trim().toLowerCase() === documento.trim().toLowerCase()
        );

        if (coincidencia) {
          setClienteEncontrado(coincidencia);
          // 3. Obtener Historial de Movimientos del Cliente
          const h = await movimientoRepository.obtenerHistorialCliente(coincidencia.id);
          setHistorialCliente(h);
        }
      }
    } catch (e: any) {
      console.error('Error al consultar saldo cliente:', e);
      setErrorText('Ocurrió un error al realizar la consulta.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header Bar */}
      <View style={[styles.topHeaderBar, { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' }]}>
        <IconButton
          icon="arrow-left"
          iconColor={colors.text}
          size={24}
          onPress={() => navigation.goBack()}
        />
        <View style={{ alignItems: 'center' }}>
          <Text variant="titleMedium" style={styles.brandTitleHeader}>
            FiaYa
          </Text>
          <Text variant="bodySmall" style={{ color: colors.textSecondary, fontSize: 11 }}>
            Portal de Clientes
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Card de Consulta */}
        <Card style={[styles.cardConsulta, { backgroundColor: colors.card, borderColor: colors.border }]} mode="outlined">
          <Card.Content style={{ paddingVertical: 18 }}>
            <Text variant="headlineSmall" style={[styles.cardTitle, { color: colors.text }]}>
              Consulta tu Estado
            </Text>
            <Text variant="bodyMedium" style={{ color: colors.textSecondary, marginBottom: 16 }}>
              Ingresa tu número de documento para ver tu deuda y movimientos recientes.
            </Text>

            <TextInput
              label="Número de Documento"
              value={documento}
              onChangeText={(v) => {
                setDocumento(v);
                setErrorText(null);
                setBuscado(false);
              }}
              mode="outlined"
              activeOutlineColor={isDarkMode ? '#bb86fc' : '#6200ee'}
              outlineColor={colors.border}
              textColor={colors.text}
              contentStyle={{ color: colors.text }}
              style={[styles.input, { backgroundColor: colors.inputBackground }]}
              placeholder="Ej: 12345678"
              placeholderTextColor={colors.textSecondary}
              right={
                documento ? (
                  <TextInput.Icon
                    icon="close-circle"
                    color={colors.textSecondary}
                    onPress={() => {
                      setDocumento('');
                      setBuscado(false);
                    }}
                  />
                ) : null
              }
            />

            {errorText && (
              <Text variant="bodySmall" style={{ color: '#ef5350', marginBottom: 10 }}>
                {errorText}
              </Text>
            )}

            <Button
              mode="contained"
              buttonColor={isDarkMode ? '#bb86fc' : '#6200ee'}
              textColor={isDarkMode ? '#000000' : '#ffffff'}
              loading={cargando}
              disabled={cargando}
              onPress={handleConsultar}
              style={styles.btnConsultar}
              contentStyle={{ paddingVertical: 6 }}
            >
              Consultar →
            </Button>
          </Card.Content>
        </Card>

        {/* Resultado de la Consulta */}
        {cargando && (
          <View style={{ marginVertical: 30, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 10, color: colors.textSecondary }}>Buscando tu información...</Text>
          </View>
        )}

        {buscado && !cargando && !clienteEncontrado && (
          <Card style={[styles.cardResultado, { backgroundColor: colors.card, borderColor: colors.border }]} mode="outlined">
            <Card.Content style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Text style={{ fontSize: 36, marginBottom: 10 }}>🔍</Text>
              <Text variant="titleMedium" style={{ color: colors.text, fontWeight: 'bold' }}>
                No se encontró registro
              </Text>
              <Text variant="bodyMedium" style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 4 }}>
                No encontramos ningún cliente registrado con el documento <Text style={{ fontWeight: 'bold' }}>{documento}</Text>. Verifica el número con el tendero.
              </Text>
            </Card.Content>
          </Card>
        )}

        {buscado && !cargando && clienteEncontrado && (
          <Card style={[styles.cardResultado, { backgroundColor: colors.card, borderColor: colors.border }]} mode="outlined">
            <Card.Content style={{ paddingVertical: 18 }}>
              {/* Encabezado Resultado con Marca de Última Sincronización */}
              <View style={styles.storeHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text variant="labelLarge" style={{ color: colors.textSecondary, fontWeight: 'bold', letterSpacing: 1 }}>
                    {tiendaCliente?.nombre || 'Supermercado La Esperanza'}
                  </Text>
                </View>

                <Chip
                  icon="sync"
                  style={{ backgroundColor: '#e8f5e9' }}
                  textStyle={{ color: '#2e7d32', fontWeight: 'bold', fontSize: 10 }}
                >
                  Sync: {formatearUltimaSincronizacion(tiendaCliente?.fechaActualizacion)}
                </Chip>
              </View>

              <Text variant="headlineSmall" style={{ color: colors.text, fontWeight: 'bold', marginVertical: 4 }}>
                {clienteEncontrado.nombre}
              </Text>

              <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                🪪 Documento: {clienteEncontrado.numeroDocumento}
              </Text>

              {/* Subtítulo informativo de Sincronización */}
              <View style={styles.syncInfoBanner}>
                <Text style={{ fontSize: 13 }}>🔄</Text>
                <Text style={{ fontSize: 11, color: '#2e7d32', fontWeight: '600' }}>
                  Datos actualizados al momento de la última sincronización de la tienda.
                </Text>
              </View>

              <Divider style={{ marginVertical: 14 }} />

              {/* Saldo de Deuda */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
                  Deuda Actual Pendiente
                </Text>

                <Text variant="headlineMedium" style={{ color: clienteEncontrado.saldoActual > 0 ? '#ef5350' : '#2e7d32', fontWeight: 'bold' }}>
                  ${(clienteEncontrado.saldoActual ?? 0).toLocaleString()}
                </Text>
              </View>

              <Divider style={{ marginVertical: 14 }} />

              {/* Lista de Movimientos Recientes */}
              <Text variant="titleSmall" style={{ color: colors.text, fontWeight: 'bold', marginBottom: 10 }}>
                Movimientos Recientes
              </Text>

              {historialCliente.length === 0 ? (
                <Text variant="bodySmall" style={{ color: colors.textSecondary, fontStyle: 'italic' }}>
                  Sin movimientos registrados.
                </Text>
              ) : (
                historialCliente.map((mov) => {
                  const esFiado = mov.tipo === 'FIADO';
                  const esPago = mov.tipo === 'PAGO';

                  return (
                    <View key={mov.id} style={styles.movRow}>
                      <Text style={{ fontSize: 18 }}>{esFiado ? '🛒' : esPago ? '💵' : '⚠️'}</Text>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text variant="bodyMedium" style={{ color: colors.text, fontWeight: '500' }}>
                          {esFiado ? 'Fiado' : esPago ? 'Pago / Abono' : 'Anulación'}: {mov.descripcion || 'General'}
                        </Text>
                        <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                          {new Date(mov.fechaCreacion).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text
                        variant="titleSmall"
                        style={{ color: esFiado ? '#ef5350' : esPago ? '#2e7d32' : '#ffb74d', fontWeight: 'bold' }}
                      >
                        ${(mov.monto ?? 0).toLocaleString()}
                      </Text>
                    </View>
                  );
                })
              )}
            </Card.Content>
          </Card>
        )}
      </ScrollView>
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
  brandTitleHeader: {
    color: '#6200ee',
    fontWeight: 'bold',
    fontSize: 18,
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  cardConsulta: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    padding: 6,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  input: {
    marginBottom: 14,
  },
  btnConsultar: {
    borderRadius: 12,
    elevation: 3,
  },
  cardResultado: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  storeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  syncInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#e8f5e9',
    padding: 8,
    borderRadius: 10,
    marginTop: 10,
  },
  movRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
});
