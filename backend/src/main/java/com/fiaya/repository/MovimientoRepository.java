package com.fiaya.repository;

import com.fiaya.model.MovimientoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MovimientoRepository extends JpaRepository<MovimientoEntity, String> {
    List<MovimientoEntity> findByTiendaIdOrderByFechaCreacionDesc(String tiendaId);
    List<MovimientoEntity> findByClienteIdOrderByFechaCreacionDesc(String clienteId);
}
