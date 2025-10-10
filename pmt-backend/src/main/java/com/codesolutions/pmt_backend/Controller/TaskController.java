package com.codesolutions.pmt_backend.Controller;

import com.codesolutions.pmt_backend.DTO.TaskDTO;
import com.codesolutions.pmt_backend.DTO.TaskHistoryDTO;
import com.codesolutions.pmt_backend.Entity.*;
import com.codesolutions.pmt_backend.Repository.ProjectRepository;
import com.codesolutions.pmt_backend.Repository.TaskHistoryRepository;
import com.codesolutions.pmt_backend.Repository.TaskRepository;
import com.codesolutions.pmt_backend.Repository.UserRepository;
import com.codesolutions.pmt_backend.Service.MailService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping({"/api/projects/{projectId}/tasks", "/projects/{projectId}/tasks"})
@CrossOrigin(origins = {"http://localhost:4200", "http://127.0.0.1:*"})
public class TaskController {

    private final TaskRepository taskRepo;
    private final ProjectRepository projectRepo;
    private final UserRepository userRepo;
    private final TaskHistoryRepository historyRepo;
    private final MailService mailService;

    public TaskController(TaskRepository taskRepo,
                          ProjectRepository projectRepo,
                          UserRepository userRepo,
                          TaskHistoryRepository historyRepo,
                          MailService mailService) {
        this.taskRepo = taskRepo;
        this.projectRepo = projectRepo;
        this.userRepo = userRepo;
        this.historyRepo = historyRepo;
        this.mailService = mailService;
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
        public UUID changedBy;     // optionnel: pour tracer qui modifie
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

    private TaskHistoryDTO toDto(TaskHistory h) {
        return new TaskHistoryDTO(
                h.getId(),
                h.getTask().getId(),
                h.getChangeLog(),
                h.getChangedBy() != null ? h.getChangedBy().getId() : null,
                h.getChangedBy() != null ? h.getChangedBy().getUsername() : null,
                h.getChangedBy() != null ? h.getChangedBy().getEmail() : null,
                h.getChangedAt()
        );
    }

    // ===== LIST
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

    // ===== GET ONE
    @GetMapping("/{taskId}")
    public ResponseEntity<?> getOne(@PathVariable UUID projectId, @PathVariable UUID taskId) {
        Optional<Task> opt = taskRepo.findById(taskId);
        if (opt.isEmpty() || !opt.get().getProject().getId().equals(projectId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Task not found"));
        }
        return ResponseEntity.ok(toDto(opt.get()));
    }

    // ===== HISTORY
    @GetMapping("/{taskId}/history")
    public ResponseEntity<?> history(@PathVariable UUID projectId, @PathVariable UUID taskId) {
        Optional<Task> opt = taskRepo.findById(taskId);
        if (opt.isEmpty() || !opt.get().getProject().getId().equals(projectId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Task not found"));
        }
        return ResponseEntity.ok(
                historyRepo.findByTaskIdOrderByChangedAtDesc(taskId).stream().map(this::toDto).toList()
        );
    }

    private void saveHistory(Task task, User by, String log) {
        TaskHistory h = new TaskHistory();
        h.setTask(task);
        h.setChangedBy(by);
        h.setChangeLog(log);
        historyRepo.save(h);
    }

    private void safeSendAssignmentMail(@Nullable User to, Task task, @Nullable User changer) {
        try {
            if (to != null && to.getEmail() != null && !to.getEmail().isBlank()) {
                final String changerDisplay = changer != null
                        ? (changer.getUsername() != null ? changer.getUsername() : changer.getEmail())
                        : "Système";
                // Compatible avec les tests qui stubbaient sendTaskAssignedMail(...),
                // mais ne casse pas si on mock seulement sendText(...)
                mailService.sendTaskAssignedMail(to, task, changerDisplay);
            }
        } catch (Exception ignored) { }
    }

    // ===== CREATE
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

            User assignee = null;
            if (req.assigneeId != null) {
                assignee = userRepo.findById(req.assigneeId)
                        .orElseThrow(() -> new IllegalArgumentException("assigneeId not found"));
                t.setAssignee(assignee);
            } else if (req.assigneeEmail != null && !req.assigneeEmail.isBlank()) {
                assignee = userRepo.findByEmail(req.assigneeEmail.trim())
                        .orElseThrow(() -> new IllegalArgumentException("assigneeEmail not found"));
                t.setAssignee(assignee);
            }

            Task saved = taskRepo.save(t);

            User changer = (req.changedBy != null) ? userRepo.findById(req.changedBy).orElse(null) : null;
            StringBuilder log = new StringBuilder("CREATED");
            log.append(": title='").append(saved.getTitle()).append("'");
            if (saved.getDescription() != null) log.append("; description='").append(saved.getDescription()).append("'");
            log.append("; status=").append(saved.getStatus().name());
            log.append("; priority=").append(saved.getPriority().name());
            if (saved.getDeadline() != null) log.append("; deadline=").append(saved.getDeadline());
            if (saved.getEndDate() != null) log.append("; endDate=").append(saved.getEndDate());
            if (saved.getAssignee() != null) log.append("; assigneeId=").append(saved.getAssignee().getId());
            saveHistory(saved, changer, log.toString());

            if (assignee != null) {
                safeSendAssignmentMail(assignee, saved, changer);
            }

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

    // ===== UPDATE (PATCH)
    @PatchMapping("/{taskId}")
    public ResponseEntity<?> update(@PathVariable UUID projectId, @PathVariable UUID taskId, @RequestBody TaskRequest req) {
        Optional<Task> opt = taskRepo.findById(taskId);
        if (opt.isEmpty() || !opt.get().getProject().getId().equals(projectId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Task not found"));
        }
        Task t = opt.get();
        User changer = (req.changedBy != null) ? userRepo.findById(req.changedBy).orElse(null) : null;

        try {
            List<String> diffs = new ArrayList<>();
            UUID oldAssigneeId = (t.getAssignee() != null ? t.getAssignee().getId() : null);

            if (req.title != null && !Objects.equals(req.title.trim(), t.getTitle())) {
                diffs.add("title: '" + t.getTitle() + "' -> '" + req.title.trim() + "'");
                t.setTitle(req.title.trim());
            }
            if (req.description != null && !Objects.equals(req.description, t.getDescription())) {
                String oldS = t.getDescription();
                String newS = req.description;
                diffs.add("description: '" + (oldS == null ? "" : oldS) + "' -> '" + (newS == null ? "" : newS) + "'");
                t.setDescription(req.description);
            }
            if (req.status != null) {
                TaskStatusEnum newS = parseStatus(req.status);
                if (!Objects.equals(newS, t.getStatus())) {
                    diffs.add("status: " + t.getStatus().name() + " -> " + newS.name());
                    t.setStatus(newS);
                }
            }
            if (req.priority != null) {
                TaskPriorityEnum newP = parsePriority(req.priority);
                if (!Objects.equals(newP, t.getPriority())) {
                    diffs.add("priority: " + t.getPriority().name() + " -> " + newP.name());
                    t.setPriority(newP);
                }
            }
            if (req.deadline != null) {
                var newD = parseDate(req.deadline);
                String oldStr = (t.getDeadline() == null ? null : t.getDeadline().toString());
                String newStr = (newD == null ? null : newD.toString());
                if (!Objects.equals(oldStr, newStr)) {
                    diffs.add("deadline: " + oldStr + " -> " + newStr);
                    t.setDeadline(newD);
                }
            }
            if (req.endDate != null) {
                var newE = parseDate(req.endDate);
                String oldStr = (t.getEndDate() == null ? null : t.getEndDate().toString());
                String newStr = (newE == null ? null : newE.toString());
                if (!Objects.equals(oldStr, newStr)) {
                    diffs.add("endDate: " + oldStr + " -> " + newStr);
                    t.setEndDate(newE);
                }
            }

            // --- Assignation
            User newAssignee = null;
            boolean assignmentChanged = false;

            if (req.assigneeId != null) {
                UUID newId = req.assigneeId.toString().isBlank() ? null : req.assigneeId;
                if (newId == null) {
                    if (oldAssigneeId != null) {
                        diffs.add("assigneeId: " + oldAssigneeId + " -> null");
                        t.setAssignee(null);
                        assignmentChanged = true;
                    }
                } else if (!Objects.equals(oldAssigneeId, newId)) {
                    newAssignee = userRepo.findById(newId)
                            .orElseThrow(() -> new IllegalArgumentException("assigneeId not found"));
                    diffs.add("assigneeId: " + (oldAssigneeId == null ? null : oldAssigneeId) + " -> " + newAssignee.getId());
                    t.setAssignee(newAssignee);
                    assignmentChanged = true;
                }
            } else if (req.assigneeEmail != null) {
                String email = req.assigneeEmail.trim();
                if (email.isBlank()) {
                    if (oldAssigneeId != null) {
                        diffs.add("assigneeEmail: " + oldAssigneeId + " -> null");
                        t.setAssignee(null);
                        assignmentChanged = true;
                    }
                } else {
                    newAssignee = userRepo.findByEmail(email)
                            .orElseThrow(() -> new IllegalArgumentException("assigneeEmail not found"));
                    if (!Objects.equals(oldAssigneeId, newAssignee.getId())) {
                        diffs.add("assigneeEmail: " + (oldAssigneeId == null ? null : oldAssigneeId) + " -> " + newAssignee.getId());
                        t.setAssignee(newAssignee);
                        assignmentChanged = true;
                    }
                }
            }

            if (!diffs.isEmpty()) {
                Task saved = taskRepo.save(t);
                String log = "UPDATED: " + String.join("; ", diffs);
                saveHistory(saved, changer, log);

                if (assignmentChanged && saved.getAssignee() != null) {
                    safeSendAssignmentMail(saved.getAssignee(), saved, changer);
                }
                return ResponseEntity.ok(toDto(saved));
            } else {
                return ResponseEntity.ok(toDto(t));
            }
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid assignee", "details", iae.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", "Update failed", "details", ex.getMessage()));
        }
    }
}
