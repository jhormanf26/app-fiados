import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Checkbox, HelperText } from 'react-native-paper';
import { useAuth } from '../auth/AuthContext';
import { useAppTheme } from '../theme/ThemeContext';

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { isDarkMode, colors } = useAppTheme();
  const { login } = useAuth();

  const [documento, setDocumento] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [recordarme, setRecordarme] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!documento.trim()) {
      setErrorText('Por favor ingresa tu NIT o Cédula.');
      return;
    }

    setCargando(true);
    setErrorText(null);
    try {
      await login(documento.trim(), password);
    } catch (e: any) {
      setErrorText(e.message || 'Error al iniciar sesión.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header Logo LedgerPro */}
        <View style={styles.headerSection}>
          <Text variant="displaySmall" style={styles.brandTitle}>
            LedgerPro
          </Text>
          <Text variant="bodyMedium" style={[styles.brandSubtitle, { color: colors.textSecondary }]}>
            Bienvenido de nuevo, tendero. Toma el control de tu negocio hoy.
          </Text>
        </View>

        {/* Form Card */}
        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Input NIT o Cédula */}
          <TextInput
            label="NIT o Cédula"
            value={documento}
            onChangeText={(v) => {
              setDocumento(v);
              setErrorText(null);
            }}
            mode="outlined"
            activeOutlineColor={isDarkMode ? '#bb86fc' : '#6200ee'}
            outlineColor={colors.border}
            textColor={colors.text}
            contentStyle={{ color: colors.text }}
            style={[styles.input, { backgroundColor: colors.inputBackground }]}
            placeholder="Ej: 1098765432"
            placeholderTextColor={colors.textSecondary}
          />

          {/* Input Contraseña */}
          <TextInput
            label="Contraseña"
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              setErrorText(null);
            }}
            mode="outlined"
            secureTextEntry={!showPassword}
            activeOutlineColor={isDarkMode ? '#bb86fc' : '#6200ee'}
            outlineColor={colors.border}
            textColor={colors.text}
            contentStyle={{ color: colors.text }}
            style={[styles.input, { backgroundColor: colors.inputBackground }]}
            placeholder="••••••••"
            placeholderTextColor={colors.textSecondary}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                color={colors.textSecondary}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />

          {errorText && (
            <HelperText type="error" visible={true} style={{ marginBottom: 4 }}>
              {errorText}
            </HelperText>
          )}

          {/* Fila Recordarme / Olvidé mi contraseña */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.checkboxTouch}
              onPress={() => setRecordarme(!recordarme)}
              activeOpacity={0.7}
            >
              <Checkbox.Android
                status={recordarme ? 'checked' : 'unchecked'}
                color={isDarkMode ? '#bb86fc' : '#6200ee'}
                onPress={() => setRecordarme(!recordarme)}
              />
              <Text variant="bodySmall" style={{ color: colors.text }}>
                Recordarme
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => alert('Para restablecer tu contraseña, contacta a soporte técnico.')}>
              <Text variant="bodySmall" style={{ color: isDarkMode ? '#bb86fc' : '#6200ee', fontWeight: 'bold' }}>
                Olvidé mi contraseña
              </Text>
            </TouchableOpacity>
          </View>

          {/* Botón Iniciar Sesión */}
          <Button
            mode="contained"
            buttonColor={isDarkMode ? '#bb86fc' : '#6200ee'}
            textColor={isDarkMode ? '#000000' : '#ffffff'}
            loading={cargando}
            disabled={cargando}
            onPress={handleLogin}
            style={styles.btnLogin}
            contentStyle={{ paddingVertical: 6 }}
          >
            Iniciar Sesión
          </Button>

          {/* Divider o espacio */}
          <View style={styles.dividerSpace} />

          {/* Botón Soy Cliente - Consultar Deuda */}
          <Button
            mode="outlined"
            textColor={isDarkMode ? '#bb86fc' : '#6200ee'}
            style={[styles.btnCliente, { borderColor: isDarkMode ? '#bb86fc' : '#6200ee' }]}
            onPress={() => navigation.navigate('ConsultaCliente')}
            contentStyle={{ paddingVertical: 4 }}
          >
            Soy Cliente - Consultar Deuda →
          </Button>
        </View>

        {/* Enlace Crear Tienda */}
        <TouchableOpacity
          style={styles.linkRegisterContainer}
          onPress={() => navigation.navigate('RegistroTienda')}
        >
          <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
            ¿No tienes tienda?{' '}
            <Text style={{ color: isDarkMode ? '#bb86fc' : '#6200ee', fontWeight: 'bold' }}>
              Crear mi Tienda
            </Text>
          </Text>
        </TouchableOpacity>

        {/* Banner Ilustrativo de Estantería de Tienda */}
        <View style={styles.heroBannerContainer}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80' }}
            style={styles.heroBannerImage}
            resizeMode="cover"
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
    maxWidth: 400,
  },
  brandTitle: {
    color: '#6200ee',
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  formCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  input: {
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 2,
  },
  checkboxTouch: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnLogin: {
    borderRadius: 12,
    elevation: 3,
  },
  dividerSpace: {
    height: 14,
  },
  btnCliente: {
    borderRadius: 12,
  },
  linkRegisterContainer: {
    marginVertical: 20,
  },
  heroBannerContainer: {
    width: '100%',
    maxWidth: 400,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 10,
  },
  heroBannerImage: {
    width: '100%',
    height: '100%',
  },
});
