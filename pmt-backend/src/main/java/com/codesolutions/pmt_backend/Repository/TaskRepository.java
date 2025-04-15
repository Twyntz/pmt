package com.codesolutions.pmt_backend.Repository;

import com.codesolutions.pmt_backend.Entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {
}
