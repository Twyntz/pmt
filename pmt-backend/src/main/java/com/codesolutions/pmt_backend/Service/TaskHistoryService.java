package com.codesolutions.pmt_backend.Service;

import com.codesolutions.pmt_backend.Entity.TaskHistory;

import java.util.List;
import java.util.UUID;

public interface TaskHistoryService {
    List<TaskHistory> getAll();
    TaskHistory save(TaskHistory history);
    TaskHistory getById(UUID id);
}
