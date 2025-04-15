package com.codesolutions.pmt_backend.Controller;

import com.codesolutions.pmt_backend.Entity.Project;
import com.codesolutions.pmt_backend.Service.ProjectService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public List<Project> getAllProjects() {
        return projectService.getAllProjects();
    }

    @PostMapping
    public Project createProject(@RequestBody Project project) {
        return projectService.createProject(project);
    }

    @GetMapping("/{id}")
    public Project getProjectById(@PathVariable UUID id) {
        return projectService.getProjectById(id);
    }
}
