import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Modal, Portal, Text, TextInput, Button, HelperText, SegmentedButtons, Searchbar, Divider, Card } from 'react-native-paper';
import { movimientoRepository } from '../../core/repositories/movimientoRepository';
import { clienteRepository } from '../../core/repositories/clienteRepository';
import { Cliente } from '../../core/types/database';
import { useAppTheme } from '../theme/ThemeContext';
import { formatearMonedaInput, desformatearMonedaInput, formatearCOP } from '../../core/utils/currency';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  tiendaId: string;
  clienteId?: string;
  nombreCliente?: string;
  tipoInicial?: 'FIADO' | 'PAGO';
  onSuccess: () => void;
}

interface AlertaLimiteData {
  nombreCliente: string;
  saldoActual: number;
  limiteEfectivo: number;
  valorFiado: number;
  nuevoSaldo: number;
  exceso: number;
}

export const NuevoMovimientoModal: React.FC<Props> = ({
  visible,
  onDismiss,
  tiendaId,
  clienteId: propClienteId,
  nombreCliente: propNombreCliente,
  tipoInicial,
  onSuccess,
}) => {
  const { colors, isDarkMode } = useAppTheme();
  const [tipo, setTipo] = useState<'FIADO' | 'PAGO'>('FIADO');
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [alertaLimiteData, setAlertaLimiteData] = useState<AlertaLimiteData | null>(null);

  // Selección de cliente con buscador
  const [listaClientes, setListaClientes] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [buscadoCliente, setBuscadoCliente] = useState('');
  const [mostrarBuscadorModal, setMostrarBuscadorModal] = useState(false);

  useEffect(() => {
    if (visible) {
      setError(null);
      setMonto('');
      setDescripcion('');
      setBuscadoCliente('');
      setMostrarBuscadorModal(false);
      setAlertaLimiteData(null);
      if (tipoInicial) {
        setTipo(tipoInicial);
      }

      if (propClienteId && propNombreCliente) {
        setClienteSeleccionado({
          id: propClienteId,
          tiendaId,
          nombre: propNombreCliente,
          numeroDocumento: '',
          telefono: '',
          saldoActual: 0,
          notificacionesAutorizadas: true,
          correoVerificado: false,
          fechaCreacion: '',
          fechaActualizacion: '',
        });
      } else if (tiendaId) {
        clienteRepository.obtenerClientes(tiendaId).then((clientes) => {
          setListaClientes(clientes);
          if (clientes.length > 0) {
            setClienteSeleccionado(clientes[0]);
          } else {
            setClienteSeleccionado(null);
          }
        });
      }
    }
  }, [visible, propClienteId, propNombreCliente, tiendaId]);

  const handleGuardar = async (autorizarExceso: boolean = false) => {
    setError(null);

    const targetClienteId = propClienteId || clienteSeleccionado?.id;
    if (!targetClienteId) {
      setError('Por favor selecciona un cliente para registrar el movimiento.');
      return;
    }

    const valorMonto = desformatearMonedaInput(monto);
    if (isNaN(valorMonto) || valorMonto <= 0) {
      setError('Por favor ingresa un monto válido mayor a cero.');
      return;
    }

    setCargando(true);
    try {
      if (tipo === 'FIADO') {
        // Verificar límite de crédito antes de proceder si no ha sido autorizado previamente
        if (!autorizarExceso) {
          const clienteObj = propClienteId
            ? await clienteRepository.obtenerClientePorId(propClienteId)
            : clienteSeleccionado;

          if (clienteObj) {
            const limiteEfectivo = await clienteRepository.obtenerLimiteCreditoEfectivo(clienteObj);
            const saldoActual = clienteObj.saldoActual ?? 0;
            const nuevoSaldo = saldoActual + valorMonto;

            if (nuevoSaldo > limiteEfectivo) {
              setCargando(false);
              setAlertaLimiteData({
                nombreCliente: clienteObj.nombre,
                saldoActual,
                limiteEfectivo,
                valorFiado: valorMonto,
                nuevoSaldo,
                exceso: nuevoSaldo - limiteEfectivo,
              });
              return;
            }
          }
        }

        await movimientoRepository.agregarFiado(
          tiendaId,
          targetClienteId,
          valorMonto,
          descripcion.trim() || undefined
        );
      } else {
        await movimientoRepository.agregarPago(
          tiendaId,
          targetClienteId,
          valorMonto,
          descripcion.trim() || undefined
        );
      }

      setMonto('');
      setDescripcion('');
      setAlertaLimiteData(null);
      onSuccess();
      onDismiss();
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al guardar el movimiento.');
    } finally {
      setCargando(false);
    }
  };

  const requiereSelector = !propClienteId;

  // Filtrado dinámico de clientes según lo que escriba el usuario en el buscador
  const clientesFiltrados = listaClientes.filter((c) => {
    if (!buscadoCliente.trim()) return true;
    const q = buscadoCliente.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(q) ||
      c.numeroDocumento.toLowerCase().includes(q) ||
      c.telefono.toLowerCase().includes(q)
    );
  });

  return (
    <Portal>
      {/* Modal Principal de Movimiento */}
      <Modal
        visible={visible && !mostrarBuscadorModal}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.container,
          { backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff' },
        ]}
      >
        <Text variant="titleLarge" style={[styles.titulo, { color: colors.text }]}>
          {tipo === 'FIADO' ? '🛒 Registrar Nuevo Fiado' : '💵 Registrar Pago / Abono'}
        </Text>

        {/* Campo Selector de Cliente con Buscador Integrado */}
        {requiereSelector ? (
          <View style={styles.selectorContainer}>
            <Text variant="labelLarge" style={{ color: colors.textSecondary, marginBottom: 6 }}>
              Seleccionar Cliente *
            </Text>
            {listaClientes.length === 0 ? (
              <Text variant="bodySmall" style={{ color: '#ef5350' }}>
                No tienes clientes registrados aún. Regístralos en la sección Clientes.
              </Text>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setMostrarBuscadorModal(true)}
                style={[
                  styles.pickerButton,
                  {
                    backgroundColor: isDarkMode ? '#2c2c2c' : '#f0f0f0',
                    borderColor: colors.primary,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 15 }}>
                    👤 {clienteSeleccionado ? clienteSeleccionado.nombre : 'Buscar y seleccionar...'}
                  </Text>
                  {clienteSeleccionado && (
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                      Doc: {clienteSeleccionado.numeroDocumento} |{' '}
                      {clienteSeleccionado.saldoActual < 0
                        ? `✨ Favor: $${Math.abs(clienteSeleccionado.saldoActual).toLocaleString()}`
                        : `Deuda: $${(clienteSeleccionado.saldoActual ?? 0).toLocaleString()}`}
                    </Text>
                  )}
                </View>
                <Text style={{ color: colors.primary, fontSize: 16, fontWeight: 'bold' }}>🔍 Cambiar</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Text variant="bodyMedium" style={styles.subtitulo}>
            Cliente: <Text style={{ fontWeight: 'bold', color: colors.primary }}>{propNombreCliente}</Text>
          </Text>
        )}

        {/* Pestañas Fiado / Pago */}
        <SegmentedButtons
          value={tipo}
          onValueChange={(val) => setTipo(val as 'FIADO' | 'PAGO')}
          buttons={[
            { value: 'FIADO', label: '🛒 Fiado', style: tipo === 'FIADO' ? styles.btnFiado : {} },
            { value: 'PAGO', label: '💵 Pago', style: tipo === 'PAGO' ? styles.btnPago : {} },
          ]}
          style={styles.segmented}
        />

        {/* Monto ($) */}
        <TextInput
          label="Monto ($) *"
          value={monto}
          onChangeText={(val) => {
            setMonto(formatearMonedaInput(val));
            setError(null);
          }}
          keyboardType="numeric"
          textColor={colors.text}
          contentStyle={{ color: colors.text }}
          activeOutlineColor={colors.primary}
          outlineColor={colors.border}
          mode="outlined"
          style={[styles.input, { backgroundColor: colors.inputBackground }]}
          left={<TextInput.Affix text="$ " />}
        />

        {/* Nota Informativa Verde si el pago genera Saldo a Favor */}
        {tipo === 'PAGO' && clienteSeleccionado && desformatearMonedaInput(monto) > clienteSeleccionado.saldoActual && (
          <Text style={{ color: isDarkMode ? '#81c784' : '#2e7d32', fontSize: 12, marginTop: -6, marginBottom: 10, fontStyle: 'italic', fontWeight: '500' }}>
            💡 Este pago generará un Saldo a Favor de {formatearCOP(desformatearMonedaInput(monto) - clienteSeleccionado.saldoActual)} para el cliente.
          </Text>
        )}

        {/* Descripción */}
        <TextInput
          label="Descripción u observación (opcional)"
          value={descripcion}
          onChangeText={setDescripcion}
          textColor={colors.text}
          contentStyle={{ color: colors.text }}
          activeOutlineColor={colors.primary}
          outlineColor={colors.border}
          mode="outlined"
          style={[styles.input, { backgroundColor: colors.inputBackground }]}
          placeholder={tipo === 'FIADO' ? 'Ej: Mercado, leche y arroz' : 'Ej: Abono quincenal'}
          placeholderTextColor={colors.textSecondary}
        />

        {error && (
          <HelperText type="error" visible={true}>
            {error}
          </HelperText>
        )}

        {/* Botones de Acción */}
        <View style={styles.btnRow}>
          <Button mode="outlined" onPress={onDismiss} style={styles.btn}>
            Cancelar
          </Button>

          <Button
            mode="contained"
            onPress={() => handleGuardar(false)}
            loading={cargando}
            disabled={cargando || (requiereSelector && !clienteSeleccionado)}
            buttonColor={isDarkMode ? '#bb86fc' : '#6200ee'}
            textColor={isDarkMode ? '#000000' : '#ffffff'}
            style={styles.btn}
          >
            Guardar
          </Button>
        </View>
      </Modal>

      {/* Sub-Modal Buscador de Clientes */}
      <Modal
        visible={visible && mostrarBuscadorModal}
        onDismiss={() => setMostrarBuscadorModal(false)}
        contentContainerStyle={[
          styles.containerBuscador,
          { backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff' },
        ]}
      >
        <Text variant="titleLarge" style={[styles.titulo, { color: colors.text, marginBottom: 12 }]}>
          🔍 Seleccionar Cliente
        </Text>

        <Searchbar
          placeholder="Buscar por nombre, documento o cel..."
          value={buscadoCliente}
          onChangeText={setBuscadoCliente}
          style={[
            styles.searchbarModal,
            {
              backgroundColor: isDarkMode ? '#121212' : '#f5f5f5',
              borderColor: isDarkMode ? '#333333' : '#cccccc',
            },
          ]}
          inputStyle={{ color: colors.text }}
          iconColor={colors.primary}
          placeholderTextColor={isDarkMode ? '#777777' : '#888888'}
          autoFocus={true}
        />

        <ScrollView style={{ maxHeight: 280, marginVertical: 10 }}>
          {clientesFiltrados.length === 0 ? (
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginVertical: 20 }}>
              No se encontraron clientes con "{buscadoCliente}".
            </Text>
          ) : (
            clientesFiltrados.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                onPress={() => {
                  setClienteSeleccionado(item);
                  setMostrarBuscadorModal(false);
                }}
                style={[
                  styles.itemClienteRow,
                  {
                    backgroundColor: clienteSeleccionado?.id === item.id
                      ? isDarkMode ? '#2c2c2c' : '#e8f5e9'
                      : 'transparent',
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 16 }}>
                    {item.nombre}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                    Doc: {item.numeroDocumento}  •  Tel: {item.telefono}
                  </Text>
                </View>

                <Text
                  style={{
                    color: item.saldoActual > 0 ? '#ef5350' : '#2e7d32',
                    fontWeight: 'bold',
                    fontSize: 13,
                  }}
                >
                  {item.saldoActual > 0 ? `$${(item.saldoActual ?? 0).toLocaleString()}` : 'Al Día'}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        <Button
          mode="outlined"
          onPress={() => setMostrarBuscadorModal(false)}
          style={{ borderRadius: 10, marginTop: 6 }}
        >
          Cerrar Buscador
        </Button>
      </Modal>

      {/* Sub-Modal Alerta de Confirmación Límite de Crédito Superado */}
      <Modal
        visible={Boolean(alertaLimiteData)}
        onDismiss={() => setAlertaLimiteData(null)}
        contentContainerStyle={[
          styles.containerAlerta,
          { backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff' },
        ]}
      >
        <View style={styles.alertaIconHeader}>
          <Text style={{ fontSize: 28 }}>⚠️</Text>
          <Text variant="titleMedium" style={{ color: '#c62828', fontWeight: 'bold', flex: 1 }}>
            ¡Atención! Límite de Crédito Superado
          </Text>
        </View>

        {alertaLimiteData && (
          <View
            style={[
              styles.alertaBoxBody,
              {
                backgroundColor: isDarkMode ? '#2c1c1c' : '#fde8e8',
                borderColor: isDarkMode ? '#7f2626' : '#f5c6c6',
              },
            ]}
          >
            <Text variant="bodyMedium" style={{ color: isDarkMode ? '#ffcdd2' : '#b71c1c', lineHeight: 22 }}>
              El cliente <Text style={{ fontWeight: 'bold' }}>{alertaLimiteData.nombreCliente}</Text> tiene un límite de crédito de{' '}
              <Text style={{ fontWeight: 'bold' }}>{formatearCOP(alertaLimiteData.limiteEfectivo)}</Text>.
            </Text>

            <View style={{ marginVertical: 10, gap: 4 }}>
              <Text style={{ color: isDarkMode ? '#ffcdd2' : '#b71c1c', fontSize: 13 }}>
                • Deuda Actual: <Text style={{ fontWeight: 'bold' }}>{formatearCOP(alertaLimiteData.saldoActual)}</Text>
              </Text>
              <Text style={{ color: isDarkMode ? '#ffcdd2' : '#b71c1c', fontSize: 13 }}>
                • Valor Nuevo Fiado: <Text style={{ fontWeight: 'bold' }}>{formatearCOP(alertaLimiteData.valorFiado)}</Text>
              </Text>
              <Divider style={{ marginVertical: 6, backgroundColor: isDarkMode ? '#7f2626' : '#f5c6c6' }} />
              <Text style={{ color: '#d32f2f', fontWeight: 'bold', fontSize: 15 }}>
                📈 La deuda subirá a: {formatearCOP(alertaLimiteData.nuevoSaldo)}
              </Text>
              <Text style={{ color: isDarkMode ? '#ef9a9a' : '#c62828', fontSize: 12, fontStyle: 'italic' }}>
                (Excede el límite establecido por {formatearCOP(alertaLimiteData.exceso)})
              </Text>
            </View>

            <Text variant="bodyMedium" style={{ color: isDarkMode ? '#ffffff' : '#1c1b1f', fontWeight: '600', marginTop: 4 }}>
              ¿Deseas autorizar y registrar este fiado de todas formas?
            </Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <Button
            mode="outlined"
            onPress={() => setAlertaLimiteData(null)}
            textColor={colors.textSecondary}
            style={{ borderRadius: 10, borderColor: colors.border }}
          >
            Cancelar
          </Button>

          <Button
            mode="contained"
            buttonColor="#d32f2f"
            textColor="#ffffff"
            loading={cargando}
            disabled={cargando}
            onPress={() => handleGuardar(true)}
            style={{ borderRadius: 10 }}
            icon="alert-check"
          >
            Sí, Autorizar Fiado
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    margin: 20,
    borderRadius: 16,
  },
  containerBuscador: {
    padding: 20,
    margin: 16,
    borderRadius: 16,
    maxHeight: '80%',
  },
  containerAlerta: {
    padding: 20,
    margin: 18,
    borderRadius: 16,
  },
  alertaIconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  alertaBoxBody: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  titulo: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitulo: {
    color: '#b0bec5',
    marginBottom: 16,
  },
  selectorContainer: {
    marginBottom: 16,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  searchbarModal: {
    borderRadius: 10,
    borderWidth: 1,
    elevation: 0,
    height: 46,
  },
  itemClienteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  segmented: {
    marginBottom: 16,
  },
  btnFiado: {
    backgroundColor: '#ef5350',
  },
  btnPago: {
    backgroundColor: '#81c784',
  },
  input: {
    marginBottom: 12,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  btn: {
    borderRadius: 10,
  },
});
