package com.codesolutions.pmt_backend.Controller;

import com.codesolutions.pmt_backend.DTO.ProjectDTO;
import com.codesolutions.pmt_backend.Entity.Project;
import com.codesolutions.pmt_backend.Service.ProjectService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/projects", "/projects"})
@CrossOrigin(origins = {"http://localhost:4200"})
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    // ----- Lecture en DTO (plat) -----
    @GetMapping
    public List<ProjectDTO> getAllProjects() {
        return projectService.getAllProjectsDto();
    }

    @GetMapping("/{id}")
    public ProjectDTO getProjectById(@PathVariable UUID id) {
        return projectService.getProjectDtoById(id);
    }

    // ----- Création via entité puis renvoi DTO -----
    @PostMapping
    public ProjectDTO createProject(@RequestBody Project project) {
        Project saved = projectService.createProject(project);
        return projectService.getProjectDtoById(saved.getId());
    }
}
