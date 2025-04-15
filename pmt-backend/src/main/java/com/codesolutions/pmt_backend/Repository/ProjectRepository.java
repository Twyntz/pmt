package com.codesolutions.pmt_backend.Repository;

import com.codesolutions.pmt_backend.Entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
}
