package com.codesolutions.pmt_backend.Controller;

import com.codesolutions.pmt_backend.DTO.ProjectDTO;
import com.codesolutions.pmt_backend.DTO.ProjectMemberDTO;
import com.codesolutions.pmt_backend.Entity.Project;
import com.codesolutions.pmt_backend.Entity.ProjectMember;
import com.codesolutions.pmt_backend.Entity.User;
import com.codesolutions.pmt_backend.Repository.ProjectMemberRepository;
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
    private final ProjectMemberRepository memberRepository;

    public ProjectController(ProjectService projectService,
                             ProjectRepository projectRepository,
                             UserRepository userRepository,
                             ProjectMemberRepository memberRepository) {
        this.projectService = projectService;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.memberRepository = memberRepository;
    }

    // ---------- DTOs d'entrée ----------
    public static class CreateProjectRequest {
        public String name;
        public String description;
        public String startDate; // "yyyy-MM-dd"
        public UUID ownerId;
    }

    public static class InviteRequest {
        public String email; // email du user à inviter
        public String role;  // optionnel : MEMBER/VIEWER... (default MEMBER)
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

    private ProjectMemberDTO toMemberDto(ProjectMember m) {
        return new ProjectMemberDTO(
                m.getId(),
                m.getProject().getId(),
                m.getUser().getId(),
                m.getUser().getUsername(),
                m.getUser().getEmail(),
                m.getRole(),
                m.getCreatedAt()
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

    // ---------- Membres ----------
    @GetMapping("/{projectId}/members")
    public ResponseEntity<?> listMembers(@PathVariable UUID projectId) {
        Optional<Project> p = projectRepository.findById(projectId);
        if (p.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Project not found"));

        List<ProjectMember> members = memberRepository.findByProject(p.get());
        return ResponseEntity.ok(members.stream().map(this::toMemberDto).toList());
    }

    @PostMapping("/{projectId}/invite")
    public ResponseEntity<?> inviteByEmail(@PathVariable UUID projectId, @RequestBody InviteRequest req) {
        if (req == null || req.email == null || req.email.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Email required"));
        }

        Optional<Project> pOpt = projectRepository.findById(projectId);
        if (pOpt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Project not found"));

        Optional<User> uOpt = userRepository.findByEmail(req.email.trim());
        if (uOpt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));

        try {
            Project p = pOpt.get();
            User u = uOpt.get();

            if (memberRepository.existsByProject_IdAndUser_Id(p.getId(), u.getId())) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Already a member"));
            }

            ProjectMember m = new ProjectMember();
            m.setProject(p);
            m.setUser(u);
            if (req.role != null && !req.role.isBlank()) m.setRole(req.role.trim());

            ProjectMember saved = memberRepository.save(m);

            return ResponseEntity.created(URI.create("/api/projects/" + p.getId() + "/members"))
                    .body(toMemberDto(saved));
        } catch (DataIntegrityViolationException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Integrity violation", "details", ex.getMostSpecificCause().getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invite failed", "details", ex.getMessage()));
        }
    }
}
