package com.codesolutions.pmt_backend.Controller;

import com.codesolutions.pmt_backend.DTO.TaskDTO;
import com.codesolutions.pmt_backend.Entity.*;
import com.codesolutions.pmt_backend.Repository.ProjectRepository;
import com.codesolutions.pmt_backend.Repository.TaskRepository;
import com.codesolutions.pmt_backend.Repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping({"/api/projects/{projectId}/tasks", "/projects/{projectId}/tasks"})
@CrossOrigin(origins = {"http://localhost:4200", "http://127.0.0.1:*"})
public class TaskController {

    private final TaskRepository taskRepo;
    private final ProjectRepository projectRepo;
    private final UserRepository userRepo;

    public TaskController(TaskRepository taskRepo, ProjectRepository projectRepo, UserRepository userRepo) {
        this.taskRepo = taskRepo;
        this.projectRepo = projectRepo;
        this.userRepo = userRepo;
    }

    public static class TaskRequest {
        public String title;
        public String description;
        public String status;      // TODO | IN_PROGRESS | DONE
        public String priority;    // LOW | MEDIUM | HIGH
        public String deadline;    // yyyy-MM-dd
        public String endDate;     // yyyy-MM-dd
        public UUID assigneeId;    // optionnel
        public String assigneeEmail; // optionnel
    }

    private static LocalDate parseDate(String s) {
        try { return (s == null || s.isBlank()) ? null : LocalDate.parse(s); }
        catch (Exception e) { return null; }
    }
    private static TaskStatusEnum parseStatus(String s) {
        try { return (s == null || s.isBlank()) ? TaskStatusEnum.TODO : TaskStatusEnum.valueOf(s.toUpperCase()); }
        catch (Exception e) { return TaskStatusEnum.TODO; }
    }
    private static TaskPriorityEnum parsePriority(String s) {
        try { return (s == null || s.isBlank()) ? TaskPriorityEnum.MEDIUM : TaskPriorityEnum.valueOf(s.toUpperCase()); }
        catch (Exception e) { return TaskPriorityEnum.MEDIUM; }
    }

    private TaskDTO toDto(Task t) {
        return new TaskDTO(
                t.getId(),
                t.getProject().getId(),
                t.getTitle(),
                t.getDescription(),
                t.getStatus(),
                t.getPriority(),
                t.getDeadline(),
                t.getEndDate(),
                (t.getAssignee() != null ? t.getAssignee().getId() : null),
                (t.getAssignee() != null ? t.getAssignee().getEmail() : null),
                (t.getAssignee() != null ? t.getAssignee().getUsername() : null),
                t.getCreatedAt()
        );
    }

    // ========= LIST
    @GetMapping
    public ResponseEntity<?> list(@PathVariable UUID projectId) {
        if (projectRepo.findById(projectId).isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Project not found"));
        }
        return ResponseEntity.ok(
                taskRepo.findByProjectIdOrderByCreatedAtDesc(projectId)
                        .stream().map(this::toDto).toList()
        );
    }

    // ========= GET ONE
    @GetMapping("/{taskId}")
    public ResponseEntity<?> getOne(@PathVariable UUID projectId, @PathVariable UUID taskId) {
        Optional<Task> opt = taskRepo.findById(taskId);
        if (opt.isEmpty() || !opt.get().getProject().getId().equals(projectId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Task not found"));
        }
        return ResponseEntity.ok(toDto(opt.get()));
    }

    // ========= CREATE
    @PostMapping
    public ResponseEntity<?> create(@PathVariable UUID projectId, @RequestBody TaskRequest req) {
        if (req == null || req.title == null || req.title.trim().length() < 3) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid payload", "details", "title min 3"));
        }
        var pOpt = projectRepo.findById(projectId);
        if (pOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Project not found"));
        }

        try {
            Task t = new Task();
            t.setProject(pOpt.get());
            t.setTitle(req.title.trim());
            t.setDescription(req.description);
            t.setStatus(parseStatus(req.status));
            t.setPriority(parsePriority(req.priority));
            t.setDeadline(parseDate(req.deadline));
            t.setEndDate(parseDate(req.endDate));

            if (req.assigneeId != null) {
                userRepo.findById(req.assigneeId).ifPresentOrElse(t::setAssignee,
                        () -> { throw new IllegalArgumentException("assigneeId not found"); });
            } else if (req.assigneeEmail != null && !req.assigneeEmail.isBlank()) {
                var u = userRepo.findByEmail(req.assigneeEmail.trim());
                if (u.isPresent()) t.setAssignee(u.get());
                else throw new IllegalArgumentException("assigneeEmail not found");
            }

            Task saved = taskRepo.save(t);
            return ResponseEntity.created(URI.create("/api/projects/" + projectId + "/tasks/" + saved.getId()))
                    .body(toDto(saved));
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid assignee", "details", iae.getMessage()));
        } catch (DataIntegrityViolationException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Integrity violation", "details", ex.getMostSpecificCause().getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", "Creation failed", "details", ex.getMessage()));
        }
    }

    // ========= UPDATE (PATCH partiel)
    @PatchMapping("/{taskId}")
    public ResponseEntity<?> update(@PathVariable UUID projectId, @PathVariable UUID taskId, @RequestBody TaskRequest req) {
        Optional<Task> opt = taskRepo.findById(taskId);
        if (opt.isEmpty() || !opt.get().getProject().getId().equals(projectId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Task not found"));
        }
        Task t = opt.get();

        try {
            // champs textuels
            if (req.title != null && !req.title.isBlank()) t.setTitle(req.title.trim());
            if (req.description != null) t.setDescription(req.description);

            // enums
            if (req.status != null) t.setStatus(parseStatus(req.status));
            if (req.priority != null) t.setPriority(parsePriority(req.priority));

            // dates
            if (req.deadline != null) t.setDeadline(parseDate(req.deadline));
            if (req.endDate != null) t.setEndDate(parseDate(req.endDate));

            // assignee
            if (req.assigneeId != null) {
                if (req.assigneeId.toString().isBlank()) {
                    t.setAssignee(null); // désassigner si string vide envoyée castée en UUID impossible -> on n'entre pas ici
                } else {
                    userRepo.findById(req.assigneeId).ifPresentOrElse(t::setAssignee,
                            () -> { throw new IllegalArgumentException("assigneeId not found"); });
                }
            } else if (req.assigneeEmail != null) {
                if (req.assigneeEmail.isBlank()) {
                    t.setAssignee(null);
                } else {
                    var u = userRepo.findByEmail(req.assigneeEmail.trim());
                    if (u.isPresent()) t.setAssignee(u.get());
                    else throw new IllegalArgumentException("assigneeEmail not found");
                }
            }

            Task saved = taskRepo.save(t);
            return ResponseEntity.ok(toDto(saved));
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid assignee", "details", iae.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", "Update failed", "details", ex.getMessage()));
        }
    }
}
