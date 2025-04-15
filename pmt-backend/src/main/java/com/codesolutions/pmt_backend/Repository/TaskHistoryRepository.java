package com.codesolutions.pmt_backend.Repository;

import com.codesolutions.pmt_backend.Entity.TaskHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface TaskHistoryRepository extends JpaRepository<TaskHistory, UUID> {
}
