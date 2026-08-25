package com.fiaya.repository;

import com.fiaya.model.ClienteEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<ClienteEntity, String> {
    List<ClienteEntity> findByTiendaId(String tiendaId);
    List<ClienteEntity> findByNumeroDocumento(String numeroDocumento);
    Optional<ClienteEntity> findByTiendaIdAndNumeroDocumento(String tiendaId, String numeroDocumento);
}
