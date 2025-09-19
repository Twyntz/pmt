package com.codesolutions.pmt_backend.Service;

import com.codesolutions.pmt_backend.DTO.ProjectDTO;
import com.codesolutions.pmt_backend.Entity.Project;

import java.util.List;
import java.util.UUID;

public interface ProjectService {
    List<Project> getAllProjects();
    Project createProject(Project project);
    Project getProjectById(UUID id);

    // DTO
    List<ProjectDTO> getAllProjectsDto();
    ProjectDTO getProjectDtoById(UUID id);
}
