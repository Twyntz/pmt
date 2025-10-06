package com.codesolutions.pmt_backend.Repository;

import com.codesolutions.pmt_backend.Entity.ProjectMember;
import com.codesolutions.pmt_backend.Entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, UUID> {
    List<ProjectMember> findByProject(Project project);
    boolean existsByProject_IdAndUser_Id(UUID projectId, UUID userId);
}
