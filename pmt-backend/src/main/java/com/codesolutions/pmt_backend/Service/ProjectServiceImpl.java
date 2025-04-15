package com.codesolutions.pmt_backend.Service;

import com.codesolutions.pmt_backend.Entity.Project;
import com.codesolutions.pmt_backend.Repository.ProjectRepository;
import com.codesolutions.pmt_backend.Service.ProjectService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;

    public ProjectServiceImpl(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    @Override
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    @Override
    public Project createProject(Project project) {
        return projectRepository.save(project);
    }

    @Override
    public Project getProjectById(UUID id) {
        Optional<Project> optionalProject = projectRepository.findById(id);
        return optionalProject.orElseThrow(() -> new RuntimeException("Projet non trouvé"));
    }
}
