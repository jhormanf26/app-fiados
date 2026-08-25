import React, { createContext, useContext, useState, useEffect } from 'react';
import { tiendaRepository } from '../../core/repositories/tiendaRepository';
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
    let t = await tiendaRepository.obtenerTienda();
    if (!t) {
      // Si no existe tienda, creamos la predeterminada para que siempre se pueda ingresar en demo
      t = await tiendaRepository.guardarTienda({
        nombre: 'Supermercado La Esperanza',
        nombrePropietario: 'Carlos Mendoza',
        documentoPropietario: documento || '1098765432',
        telefono: '3001234567',
        correo: 'tienda@laesperanza.com',
        limiteCreditoPredeterminado: 100000,
      });
    }

    setTienda(t);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY_SESSION, t.id);
    }
    return true;
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
