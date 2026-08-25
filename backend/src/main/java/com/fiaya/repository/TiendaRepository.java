package com.fiaya.repository;

import com.fiaya.model.TiendaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TiendaRepository extends JpaRepository<TiendaEntity, String> {
    Optional<TiendaEntity> findByDocumentoPropietario(String documentoPropietario);
    Optional<TiendaEntity> findByCorreo(String correo);
}
