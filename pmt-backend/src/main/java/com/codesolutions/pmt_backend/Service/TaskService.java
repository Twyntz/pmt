package com.codesolutions.pmt_backend.Service;

import com.codesolutions.pmt_backend.Entity.Task;

import java.util.List;
import java.util.UUID;

public interface TaskService {
    List<Task> getAllTasks();
    Task createTask(Task task);
    Task getTaskById(UUID id);
}
