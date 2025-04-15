package com.codesolutions.pmt_backend.Service;

import com.codesolutions.pmt_backend.Entity.TaskHistory;
import com.codesolutions.pmt_backend.Repository.TaskHistoryRepository;
import com.codesolutions.pmt_backend.Service.TaskHistoryService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class TaskHistoryServiceImpl implements TaskHistoryService {

    private final TaskHistoryRepository repository;

    public TaskHistoryServiceImpl(TaskHistoryRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<TaskHistory> getAll() {
        return repository.findAll();
    }

    @Override
    public TaskHistory save(TaskHistory history) {
        return repository.save(history);
    }

    @Override
    public TaskHistory getById(UUID id) {
        Optional<TaskHistory> optional = repository.findById(id);
        return optional.orElseThrow(() -> new RuntimeException("Historique non trouvé"));
    }
}
