package com.codesolutions.pmt_backend.Repository;

import com.codesolutions.pmt_backend.Entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {

    // Liste les tâches d’un projet, triées par date de création (desc)
    @Query("""
           select t
           from Task t
           where t.project.id = :projectId
           order by t.createdAt desc
           """)
    List<Task> findByProjectIdOrderByCreatedAtDesc(@Param("projectId") UUID projectId);

    // (Optionnel) si tu préfères la version Spring-data enchaînée,
    // tu peux AUSSI déclarer celle-ci ; garde au moins la JPQL ci-dessus.
    // List<Task> findByProject_IdOrderByCreatedAtDesc(UUID projectId);
}
