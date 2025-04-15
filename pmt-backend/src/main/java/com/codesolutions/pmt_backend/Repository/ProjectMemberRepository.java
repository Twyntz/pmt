package com.codesolutions.pmt_backend.Repository;

import com.codesolutions.pmt_backend.Entity.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, UUID> {
}
