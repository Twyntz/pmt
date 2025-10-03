package com.codesolutions.pmt_backend.Controller;

import com.codesolutions.pmt_backend.DTO.ProjectDTO;
import com.codesolutions.pmt_backend.Entity.Project;
import com.codesolutions.pmt_backend.Entity.User;
import com.codesolutions.pmt_backend.Repository.ProjectRepository;
import com.codesolutions.pmt_backend.Repository.UserRepository;
import com.codesolutions.pmt_backend.Service.ProjectService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping({"/api/projects", "/projects"})
@CrossOrigin(origins = {"http://localhost:4200", "http://127.0.0.1:*"})
public class ProjectController {

    private final ProjectService projectService;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public ProjectController(ProjectService projectService, ProjectRepository projectRepository, UserRepository userRepository) {
        this.projectService = projectService;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }

    // ---------- DTOs d'entrée ----------
    public static class CreateProjectRequest {
        public String name;
        public String description;
        public String startDate; // "yyyy-MM-dd"
        public UUID ownerId;
    }

    // ---------- Helpers ----------
    private ProjectDTO toDto(Project p) {
        return new ProjectDTO(
            p.getId(),
            p.getName(),
            p.getDescription(),
            p.getStartDate(),
            (p.getOwner() != null ? p.getOwner().getId() : null),
            p.getCreatedAt()
        );
    }

    private static LocalDate parseDate(String s) {
        try { return (s == null || s.isBlank()) ? null : LocalDate.parse(s); }
        catch (Exception e) { return null; }
    }

    // ---------- Endpoints lecture ----------
    @GetMapping
    public List<ProjectDTO> getAllProjects() {
        return projectService.getAllProjectsDto();
    }

    @GetMapping("/{id}")
    public ProjectDTO getProjectById(@PathVariable UUID id) {
        return projectService.getProjectDtoById(id);
    }

    // ---------- Création ----------
    @PostMapping
    public ResponseEntity<?> createProject(@RequestBody CreateProjectRequest req) {
        if (req == null || req.name == null || req.name.trim().length() < 3 || req.ownerId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid payload", "details", "name(min 3) et ownerId requis"));
        }

        Optional<User> ownerOpt = userRepository.findById(req.ownerId);
        if (ownerOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Owner not found"));
        }

        try {
            User owner = ownerOpt.get();
            Project p = new Project();
            p.setName(req.name.trim());
            p.setDescription(req.description);
            p.setStartDate(parseDate(req.startDate));
            p.setOwner(owner);

            Project saved = projectRepository.save(p);
            return ResponseEntity.created(URI.create("/api/projects/" + saved.getId()))
                    .body(toDto(saved));
        } catch (DataIntegrityViolationException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Integrity violation", "details", ex.getMostSpecificCause().getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Creation failed", "details", ex.getMessage()));
        }
    }
}
