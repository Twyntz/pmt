package com.codesolutions.pmt_backend.Repository;

import com.codesolutions.pmt_backend.DTO.ProjectDTO;
import com.codesolutions.pmt_backend.Entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {

    @Query("""
        select new com.codesolutions.pmt_backend.DTO.ProjectDTO(
            p.id, p.name, p.description, p.startDate, p.owner.id, p.createdAt
        )
        from Project p
        """)
    List<ProjectDTO> findAllAsDto();

    @Query("""
        select new com.codesolutions.pmt_backend.DTO.ProjectDTO(
            p.id, p.name, p.description, p.startDate, p.owner.id, p.createdAt
        )
        from Project p
        where p.id = :id
        """)
    ProjectDTO findDtoById(UUID id);
}
