import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Modal, Portal, Text, TextInput, Button, HelperText, SegmentedButtons } from 'react-native-paper';
import { movimientoRepository } from '../../core/repositories/movimientoRepository';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  tiendaId: string;
  clienteId: string;
  nombreCliente: string;
  onSuccess: () => void;
}

export const NuevoMovimientoModal: React.FC<Props> = ({
  visible,
  onDismiss,
  tiendaId,
  clienteId,
  nombreCliente,
  onSuccess,
}) => {
  const [tipo, setTipo] = useState<'FIADO' | 'PAGO'>('FIADO');
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [alertaLimite, setAlertaLimite] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const handleGuardar = async () => {
    setError(null);
    setAlertaLimite(null);

    const valorMonto = parseFloat(monto.replace(/[^0-9.]/g, ''));
    if (isNaN(valorMonto) || valorMonto <= 0) {
      setError('Por favor ingresa un monto válido mayor a cero.');
      return;
    }

    setCargando(true);
    try {
      if (tipo === 'FIADO') {
        const resultado = await movimientoRepository.agregarFiado(
          tiendaId,
          clienteId,
          valorMonto,
          descripcion.trim() || undefined
        );

        if (resultado.limiteSuperado) {
          setAlertaLimite(
            `⚠️ ¡Atención! El nuevo saldo sobrepasa el límite de crédito ($${resultado.limiteEfectivo.toLocaleString()}).`
          );
        }
      } else {
        await movimientoRepository.agregarPago(
          tiendaId,
          clienteId,
          valorMonto,
          descripcion.trim() || undefined
        );
      }

      setMonto('');
      setDescripcion('');
      onSuccess();
      onDismiss();
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al guardar el movimiento.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.container}>
        <Text variant="titleLarge" style={styles.titulo}>
          {tipo === 'FIADO' ? '🛒 Registrar Nuevo Fiado' : '💵 Registrar Pago / Abono'}
        </Text>
        <Text variant="bodyMedium" style={styles.subtitulo}>
          Cliente: <Text style={{ fontWeight: 'bold', color: '#bb86fc' }}>{nombreCliente}</Text>
        </Text>

        <SegmentedButtons
          value={tipo}
          onValueChange={(val) => setTipo(val as 'FIADO' | 'PAGO')}
          buttons={[
            { value: 'FIADO', label: '🛒 Fiado', style: tipo === 'FIADO' ? styles.btnFiado : {} },
            { value: 'PAGO', label: '💵 Pago', style: tipo === 'PAGO' ? styles.btnPago : {} },
          ]}
          style={styles.segmented}
        />

        <TextInput
          label="Monto ($)"
          value={monto}
          onChangeText={(val) => {
            setMonto(val);
            setError(null);
          }}
          keyboardType="numeric"
          textColor="#ffffff"
          contentStyle={{ color: '#ffffff' }}
          activeOutlineColor="#bb86fc"
          outlineColor="#555555"
          mode="outlined"
          style={styles.input}
          left={<TextInput.Icon icon="currency-usd" color="#bb86fc" />}
        />

        <TextInput
          label="Descripción u observación (opcional)"
          value={descripcion}
          onChangeText={setDescripcion}
          textColor="#ffffff"
          contentStyle={{ color: '#ffffff' }}
          activeOutlineColor="#bb86fc"
          outlineColor="#555555"
          mode="outlined"
          style={styles.input}
          placeholder={tipo === 'FIADO' ? 'Ej: Mercado, leche y pan' : 'Ej: Abono quincenal'}
          placeholderTextColor="#888888"
          left={<TextInput.Icon icon="note-text-outline" color="#bb86fc" />}
        />

        {error && (
          <HelperText type="error" visible={true}>
            {error}
          </HelperText>
        )}

        {alertaLimite && (
          <HelperText type="error" visible={true} style={styles.alerta}>
            {alertaLimite}
          </HelperText>
        )}

        <View style={styles.btnRow}>
          <Button mode="outlined" onPress={onDismiss} style={styles.btn}>
            Cancelar
          </Button>
          <Button
            mode="contained"
            onPress={handleGuardar}
            loading={cargando}
            disabled={cargando}
            buttonColor={tipo === 'FIADO' ? '#c62828' : '#2e7d32'}
            style={styles.btn}
          >
            Guardar
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e1e1e',
    padding: 20,
    margin: 20,
    borderRadius: 16,
  },
  titulo: {
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitulo: {
    color: '#b0bec5',
    marginBottom: 16,
  },
  segmented: {
    marginBottom: 16,
  },
  btnFiado: {
    backgroundColor: '#c62828',
  },
  btnPago: {
    backgroundColor: '#2e7d32',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#121212',
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  btn: {
    borderRadius: 8,
  },
  alerta: {
    color: '#ffb74d',
    fontSize: 13,
  },
});
