import React, { createContext, useContext, useState, useEffect } from 'react';
import { tiendaRepository } from '../../core/repositories/tiendaRepository';
import { motorSincronizacion } from '../../core/sync/syncEngine';
import { Tienda } from '../../core/types/database';

interface AuthContextData {
  tienda: Tienda | null;
  isLoggedIn: boolean;
  cargandoSesion: boolean;
  login: (documento: string, clave?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  registrarTienda: (datos: {
    nombre: string;
    documentoPropietario: string;
    categoria?: string;
    direccion?: string;
    telefono?: string;
    correo?: string;
    limiteCreditoPredeterminado?: number;
  }) => Promise<Tienda>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const STORAGE_KEY_SESSION = 'ledgerpro_tienda_activa_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tienda, setTienda] = useState<Tienda | null>(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);

  useEffect(() => {
    const verificarSesion = async () => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const guardadoId = window.localStorage.getItem(STORAGE_KEY_SESSION);
          if (guardadoId) {
            const t = await tiendaRepository.obtenerTienda();
            if (t) {
              setTienda(t);
            }
          }
        }
      } catch (e) {
        console.warn('[AuthContext] Error al verificar sesión:', e);
      } finally {
        setCargandoSesion(false);
      }
    };
    verificarSesion();
  }, []);

  const login = async (documento: string, clave?: string): Promise<boolean> => {
    const docLimpio = documento.trim();
    const docIngresado = docLimpio.toLowerCase();
    const claveIngresada = clave ? clave.trim() : '';

    let t = await tiendaRepository.obtenerTienda();
    const docTiendaLocal = t && t.documentoPropietario ? String(t.documentoPropietario).trim().toLowerCase() : '';

    // 1. Si la tienda ya existe localmente y coincide con el documento ingresado
    if (t && docTiendaLocal === docIngresado) {
      // Validar clave local si la tienda tiene clave guardada
      if (t.clave && claveIngresada && t.clave !== claveIngresada && !t.clave.startsWith('$2a$')) {
        throw new Error('Contraseña incorrecta. Por favor verifica la clave ingresada.');
      }
      setTienda(t);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY_SESSION, t.id);
      }
      return true;
    }

    // 2. Si no coincide o no existe localmente, intentar descargar el snapshot desde la nube (Pull Sync con clave)
    console.log(`[AuthContext] 🔍 Intentando descargar snapshot en nube para documento: ${docLimpio}`);
    const resPull = await motorSincronizacion.descargarDatosServidor(docLimpio, claveIngresada);

    if (resPull.exito) {
      const tiendaDescargada = await tiendaRepository.obtenerTienda();
      if (tiendaDescargada) {
        setTienda(tiendaDescargada);
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(STORAGE_KEY_SESSION, tiendaDescargada.id);
        }
        return true;
      }
    }

    // 3. Si no se pudo descargar
    if (resPull.mensajeError) {
      throw new Error(resPull.mensajeError);
    }

    if (!t) {
      throw new Error(`No se encontró una tienda registrada con el NIT o Cédula '${docLimpio}'. Verifica tu conexión a internet o crea una tienda nueva.`);
    } else {
      throw new Error(`El NIT o Cédula '${docLimpio}' no corresponde a la tienda registrada en este dispositivo (${t.nombre}).`);
    }
  };

  const logout = async () => {
    setTienda(null);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY_SESSION);
    }
  };

  const registrarTienda = async (datos: {
    nombre: string;
    documentoPropietario: string;
    categoria?: string;
    direccion?: string;
    telefono?: string;
    correo?: string;
    limiteCreditoPredeterminado?: number;
  }): Promise<Tienda> => {
    const nuevaTienda = await tiendaRepository.guardarTienda({
      nombre: datos.nombre,
      nombrePropietario: 'Propietario',
      documentoPropietario: datos.documentoPropietario,
      direccion: datos.direccion,
      telefono: datos.telefono || '3000000000',
      correo: datos.correo || 'tienda@ledgerpro.com',
      limiteCreditoPredeterminado: datos.limiteCreditoPredeterminado || 100000,
    });

    setTienda(nuevaTienda);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY_SESSION, nuevaTienda.id);
    }
    return nuevaTienda;
  };

  return (
    <AuthContext.Provider
      value={{
        tienda,
        isLoggedIn: Boolean(tienda),
        cargandoSesion,
        login,
        logout,
        registrarTienda,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
