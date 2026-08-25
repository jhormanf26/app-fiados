import { inicializarBaseDatos } from '../core/database/db';
import { tiendaRepository } from '../core/repositories/tiendaRepository';
import { clienteRepository } from '../core/repositories/clienteRepository';
import { movimientoRepository } from '../core/repositories/movimientoRepository';

/**
 * Suite de Pruebas de Integración y Flujo de Usuario Tendero
 * Simula la experiencia de un tendero desde la instalación de la app.
 */
async function probarFlujoTenderoCompleto() {
  console.log('=== INICIANDO PRUEBA DE FLUJO DE USUARIO TENDERO ===\n');

  // 1. Inicialización de BD al abrir la app por primera vez
  console.log('1. Inicializando base de datos local...');
  const bdOk = await inicializarBaseDatos();
  if (!bdOk) throw new Error('Fallo al inicializar la base de datos');
  console.log('   ✓ BD Inicializada correctamente.');

  // 2. Registro de Nueva Tienda (Onboarding)
  console.log('\n2. Registrando nueva tienda (Granero El Triunfo)...');
  const nuevaTienda = await tiendaRepository.guardarTienda({
    nombre: 'Granero El Triunfo',
    nombrePropietario: 'Pedro Gómez',
    documentoPropietario: '1098765432',
    telefono: '3101234567',
    correo: 'pedro@eltriunfo.com',
    direccion: 'Calle 10 # 5-20',
    limiteCreditoPredeterminado: 150000,
  });

  if (!nuevaTienda.id || nuevaTienda.nombre !== 'Granero El Triunfo') {
    throw new Error('Error al registrar la tienda');
  }
  console.log(`   ✓ Tienda creada con ID: ${nuevaTienda.id}`);
  console.log(`   ✓ Límite de crédito predeterminado: $${nuevaTienda.limiteCreditoPredeterminado}`);

  // 3. Creación de Clientes
  console.log('\n3. Creando cliente con límite predeterminado y cliente con límite personalizado...');
  const cliente1 = await clienteRepository.crearCliente(nuevaTienda.id, {
    nombre: 'Doña Martha Lucía',
    numeroDocumento: '52123456',
    telefono: '3159876543',
    correo: 'martha@gmail.com',
    notificacionesAutorizadas: true,
    correoVerificado: true,
  });

  const cliente2 = await clienteRepository.crearCliente(nuevaTienda.id, {
    nombre: 'Carlos Ramírez',
    numeroDocumento: '1012345678',
    telefono: '3007654321',
    notificacionesAutorizadas: false,
    correoVerificado: false,
    limiteCreditoPersonalizado: 300000, // Límite preferencial de $300k
  });

  console.log(`   ✓ Cliente 1 creado: ${cliente1.nombre} (Saldo: $${cliente1.saldoActual})`);
  console.log(`   ✓ Cliente 2 creado: ${cliente2.nombre} (Límite pers.: $${cliente2.limiteCreditoPersonalizado})`);

  // 4. Verificación de Límite de Crédito Efectivo
  const limiteEfectivo1 = await clienteRepository.obtenerLimiteCreditoEfectivo(cliente1);
  const limiteEfectivo2 = await clienteRepository.obtenerLimiteCreditoEfectivo(cliente2);
  if (limiteEfectivo1 !== 150000 || limiteEfectivo2 !== 300000) {
    throw new Error('Error en el cálculo del límite de crédito efectivo');
  }
  console.log('   ✓ Límites de crédito calculados correctamente (150k tienda vs 300k personalizado).');

  // 5. Registrar Primer Fiado dentro del límite
  console.log('\n4. Registrando fiado de $50,000 para Doña Martha...');
  const resFiado1 = await movimientoRepository.agregarFiado(
    nuevaTienda.id,
    cliente1.id,
    50000,
    'Víveres de la semana'
  );
  if (resFiado1.limiteSuperado) {
    throw new Error('El fiado de $50,000 no debió superar el límite de $150,000');
  }
  console.log(`   ✓ Fiado registrado. Nuevo saldo Doña Martha: $${resFiado1.movimiento.nuevoSaldo}`);

  // 6. Registrar Fiado que Supera el Límite de Crédito (Detección de Alerta)
  console.log('\n5. Intentando registrar fiado de $110,000 adicionales para Doña Martha (Total superaría $150,000)...');
  const resFiado2 = await movimientoRepository.agregarFiado(
    nuevaTienda.id,
    cliente1.id,
    110000,
    'Compra grande de fin de mes'
  );

  if (!resFiado2.limiteSuperado) {
    throw new Error('Se esperaba alerta de límite superado (50k + 110k = 160k > 150k)');
  }
  console.log(`   ⚠️ ALERTA ACTIVADA: Límite superado detectado correctamente ($160,000 > $150,000).`);
  console.log(`   ✓ Movimiento completado bajo aprobación del tendero. Saldo: $${resFiado2.movimiento.nuevoSaldo}`);

  // 7. Registrar Abono / Pago de Deuda
  console.log('\n6. Registrando abono de $60,000 por parte de Doña Martha...');
  const pago1 = await movimientoRepository.agregarPago(
    nuevaTienda.id,
    cliente1.id,
    60000,
    'Abono en efectivo'
  );
  console.log(`   ✓ Pago registrado exitosamente. Nuevo saldo Doña Martha: $${pago1.nuevoSaldo}`);
  if (pago1.nuevoSaldo !== 100000) {
    throw new Error(`Se esperaba saldo de $100,000 pero se obtuvo $${pago1.nuevoSaldo}`);
  }

  // 8. Anulación de Transacción con Motivo
  console.log('\n7. Probando anulación del pago de $60,000 por error en digitación...');
  const anulado = await movimientoRepository.anularMovimiento(pago1.id, 'Error en digitación de monto');
  console.log(`   ✓ Movimiento anulado. Motivo auditado: "${anulado.motivoAnulacion}"`);
  console.log(`   ✓ Saldo revertido a Doña Martha: $${anulado.nuevoSaldo}`);
  if (anulado.nuevoSaldo !== 160000) {
    throw new Error(`Se esperaba saldo revertido de $160,000 pero se obtuvo $${anulado.nuevoSaldo}`);
  }

  // 9. Consulta de Historial Cronológico
  console.log('\n8. Obteniendo historial cronológico de movimientos de Doña Martha...');
  const historial = await movimientoRepository.obtenerHistorialCliente(cliente1.id);
  console.log(`   ✓ Total de movimientos en libreta digital: ${historial.length}`);
  historial.forEach((m, idx) => {
    console.log(`     [${idx + 1}] ${m.tipo} - Monto: $${m.monto} - Saldo R: $${m.nuevoSaldo} - Estado: ${m.estadoSincronizacion}`);
  });

  // 10. Resumen de Cartera y Movimientos del Día para Dashboard
  console.log('\n9. Verificando métricas del Dashboard del Tendero...');
  const resumen = await movimientoRepository.obtenerResumenCartera(nuevaTienda.id);
  const movsDia = await movimientoRepository.obtenerMovimientosDelDia(nuevaTienda.id);
  console.log(`   ✓ Total Fiado Acumulado: $${resumen.totalFiado}`);
  console.log(`   ✓ Total Recuperado en Pagos: $${resumen.totalRecuperado}`);
  console.log(`   ✓ Movimientos recientes en el día: ${movsDia.length}`);

  // 11. Búsqueda de Clientes
  console.log('\n10. Probando buscador instantáneo de clientes...');
  const resBusqueda = await clienteRepository.obtenerClientes(nuevaTienda.id, 'Martha');
  if (resBusqueda.length !== 1 || resBusqueda[0].nombre !== 'Doña Martha Lucía') {
    throw new Error('Fallo en la búsqueda de clientes');
  }
  console.log(`   ✓ Cliente encontrado por filtro "Martha": ${resBusqueda[0].nombre}`);

  // 12. Prueba de Saldo a Favor (Pago en exceso)
  console.log('\n11. Probando Saldo a Favor cuando un cliente paga más de su deuda actual...');
  // Deuda actual de Carlos es $0. Carlos paga $15,000 COP.
  const pagoExceso = await movimientoRepository.agregarPago(nuevaTienda.id, cliente2.id, 15000, 'Anticipo en efectivo');
  if (pagoExceso.nuevoSaldo !== -15000) {
    throw new Error(`Se esperaba Saldo a Favor (-$15,000) pero se obtuvo ${pagoExceso.nuevoSaldo}`);
  }
  console.log(`   ✨ Saldo a Favor registrado correctamente: $${Math.abs(pagoExceso.nuevoSaldo)} COP para Carlos.`);

  console.log('\n=== ¡TODAS LAS PRUEBAS DEL FLUJO TENDERO SE EJECUTARON CON ÉXITO! ===');
}

probarFlujoTenderoCompleto().catch((err) => {
  console.error('\n❌ ERROR EN LA PRUEBA DE FLUJO:', err);
  process.exit(1);
});
