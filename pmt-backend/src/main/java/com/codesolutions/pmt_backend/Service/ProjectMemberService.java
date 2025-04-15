package com.codesolutions.pmt_backend.Service;

import com.codesolutions.pmt_backend.Entity.ProjectMember;

import java.util.List;
import java.util.UUID;

public interface ProjectMemberService {
    List<ProjectMember> getAll();
    ProjectMember addMember(ProjectMember member);
    ProjectMember getById(UUID id);
}
