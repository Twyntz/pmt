package com.codesolutions.pmt_backend.Repository;

import com.codesolutions.pmt_backend.Entity.TaskHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface TaskHistoryRepository extends JpaRepository<TaskHistory, UUID> {

    @Query("""
           select h from TaskHistory h
           where h.task.id = :taskId
           order by h.changedAt desc, h.id desc
           """)
    List<TaskHistory> findByTaskIdOrderByChangedAtDesc(UUID taskId);
}
