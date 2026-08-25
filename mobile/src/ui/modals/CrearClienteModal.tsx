import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Modal, Portal, Text, TextInput, Button, Switch, HelperText } from 'react-native-paper';
import { clienteRepository } from '../../core/repositories/clienteRepository';
import { Cliente } from '../../core/types/database';
import { useAppTheme } from '../theme/ThemeContext';
import { formatearMonedaInput, desformatearMonedaInput } from '../../core/utils/currency';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  tiendaId: string;
  clienteEditar?: Cliente | null;
  onSuccess: () => void;
}

export const CrearClienteModal: React.FC<Props> = ({
  visible,
  onDismiss,
  tiendaId,
  clienteEditar,
  onSuccess,
}) => {
  const { isDarkMode, colors } = useAppTheme();
  const [nombre, setNombre] = useState('');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [limitePersonalizado, setLimitePersonalizado] = useState('');
  const [notificacionesAutorizadas, setNotificacionesAutorizadas] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const primaryAccent = isDarkMode ? '#bb86fc' : '#6200ee';

  useEffect(() => {
    if (clienteEditar) {
      setNombre(clienteEditar.nombre);
      setNumeroDocumento(clienteEditar.numeroDocumento);
      setTelefono(clienteEditar.telefono);
      setCorreo(clienteEditar.correo ?? '');
      setLimitePersonalizado(
        clienteEditar.limiteCreditoPersonalizado !== undefined
          ? formatearMonedaInput(clienteEditar.limiteCreditoPersonalizado)
          : ''
      );
      setNotificacionesAutorizadas(clienteEditar.notificacionesAutorizadas);
    } else {
      setNombre('');
      setNumeroDocumento('');
      setTelefono('');
      setCorreo('');
      setLimitePersonalizado('');
      setNotificacionesAutorizadas(true);
    }
  }, [clienteEditar, visible]);

  const handleGuardar = async () => {
    setError(null);
    if (!nombre.trim()) {
      setError('El nombre del cliente es obligatorio.');
      return;
    }
    if (!numeroDocumento.trim()) {
      setError('El número de documento es obligatorio.');
      return;
    }
    if (!telefono.trim()) {
      setError('El número de teléfono es obligatorio.');
      return;
    }

    const limiteVal = limitePersonalizado.trim() ? desformatearMonedaInput(limitePersonalizado) : undefined;

    setCargando(true);
    try {
      if (clienteEditar) {
        await clienteRepository.actualizarCliente(clienteEditar.id, {
          nombre: nombre.trim(),
          numeroDocumento: numeroDocumento.trim(),
          telefono: telefono.trim(),
          correo: correo.trim() || undefined,
          limiteCreditoPersonalizado: limiteVal,
          notificacionesAutorizadas,
        });
      } else {
        await clienteRepository.crearCliente(tiendaId, {
          nombre: nombre.trim(),
          numeroDocumento: numeroDocumento.trim(),
          telefono: telefono.trim(),
          correo: correo.trim() || undefined,
          limiteCreditoPersonalizado: limiteVal,
          notificacionesAutorizadas,
          correoVerificado: false,
        });
      }

      onSuccess();
      onDismiss();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el cliente.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.container,
          { backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff' },
        ]}
      >
        <Text variant="titleLarge" style={[styles.titulo, { color: colors.text }]}>
          {clienteEditar ? '✏️ Editar Cliente' : '👤 Crear Nuevo Cliente'}
        </Text>

        <TextInput
          label="Nombre Completo *"
          value={nombre}
          onChangeText={(val) => {
            setNombre(val);
            setError(null);
          }}
          textColor={colors.text}
          contentStyle={{ color: colors.text }}
          activeOutlineColor={primaryAccent}
          outlineColor={colors.border}
          mode="outlined"
          style={[styles.input, { backgroundColor: colors.inputBackground }]}
          placeholderTextColor={colors.textSecondary}
          left={<TextInput.Icon icon="account" color={primaryAccent} />}
        />

        <TextInput
          label="Número de Documento / Cédula *"
          value={numeroDocumento}
          onChangeText={(val) => {
            setNumeroDocumento(val);
            setError(null);
          }}
          keyboardType="numeric"
          textColor={colors.text}
          contentStyle={{ color: colors.text }}
          activeOutlineColor={primaryAccent}
          outlineColor={colors.border}
          mode="outlined"
          style={[styles.input, { backgroundColor: colors.inputBackground }]}
          placeholderTextColor={colors.textSecondary}
          left={<TextInput.Icon icon="card-account-details" color={primaryAccent} />}
        />

        <TextInput
          label="Teléfono / Celular *"
          value={telefono}
          onChangeText={(val) => {
            setTelefono(val);
            setError(null);
          }}
          keyboardType="phone-pad"
          textColor={colors.text}
          contentStyle={{ color: colors.text }}
          activeOutlineColor={primaryAccent}
          outlineColor={colors.border}
          mode="outlined"
          style={[styles.input, { backgroundColor: colors.inputBackground }]}
          placeholderTextColor={colors.textSecondary}
          left={<TextInput.Icon icon="phone" color={primaryAccent} />}
        />

        <TextInput
          label="Correo Electrónico (para notificaciones)"
          value={correo}
          onChangeText={(val) => setCorreo(val)}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textColor={colors.text}
          contentStyle={{ color: colors.text }}
          activeOutlineColor={primaryAccent}
          outlineColor={colors.border}
          mode="outlined"
          style={[styles.input, { backgroundColor: colors.inputBackground }]}
          placeholderTextColor={colors.textSecondary}
          left={<TextInput.Icon icon="email" color={primaryAccent} />}
        />

        <TextInput
          label="Límite Crédito Personalizado ($ opcional)"
          value={limitePersonalizado}
          onChangeText={(val) => setLimitePersonalizado(formatearMonedaInput(val))}
          keyboardType="numeric"
          textColor={colors.text}
          contentStyle={{ color: colors.text }}
          activeOutlineColor={primaryAccent}
          outlineColor={colors.border}
          mode="outlined"
          style={[styles.input, { backgroundColor: colors.inputBackground }]}
          placeholder="Dejar vacío para usar el predeterminado"
          placeholderTextColor={colors.textSecondary}
          left={<TextInput.Icon icon="shield-alert-outline" color={primaryAccent} />}
        />

        <View style={styles.switchRow}>
          <Text variant="bodyMedium" style={{ color: colors.text, flex: 1 }}>
            ¿Autoriza notificaciones por correo?
          </Text>
          <Switch
            value={notificacionesAutorizadas}
            onValueChange={setNotificacionesAutorizadas}
            color={primaryAccent}
          />
        </View>

        {error && (
          <HelperText type="error" visible={true}>
            {error}
          </HelperText>
        )}

        <View style={styles.btnRow}>
          <Button
            mode="outlined"
            onPress={onDismiss}
            textColor={colors.textSecondary}
            style={[styles.btn, { borderColor: colors.border }]}
          >
            Cancelar
          </Button>
          <Button
            mode="contained"
            onPress={handleGuardar}
            loading={cargando}
            disabled={cargando}
            buttonColor={primaryAccent}
            textColor={isDarkMode ? '#000000' : '#ffffff'}
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
    padding: 20,
    margin: 20,
    borderRadius: 16,
  },
  titulo: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    marginBottom: 10,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
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
});
