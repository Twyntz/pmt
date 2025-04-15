package com.codesolutions.pmt_backend.Controller;

import com.codesolutions.pmt_backend.Entity.TaskHistory;
import com.codesolutions.pmt_backend.Service.TaskHistoryService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/task-history")
public class TaskHistoryController {

    private final TaskHistoryService taskHistoryService;

    public TaskHistoryController(TaskHistoryService taskHistoryService) {
        this.taskHistoryService = taskHistoryService;
    }

    @GetMapping
    public List<TaskHistory> getAll() {
        return taskHistoryService.getAll();
    }

    @PostMapping
    public TaskHistory save(@RequestBody TaskHistory history) {
        return taskHistoryService.save(history);
    }

    @GetMapping("/{id}")
    public TaskHistory getById(@PathVariable UUID id) {
        return taskHistoryService.getById(id);
    }
}
