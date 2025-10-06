package com.codesolutions.pmt_backend.DTO;

import com.codesolutions.pmt_backend.Entity.TaskPriorityEnum;
import com.codesolutions.pmt_backend.Entity.TaskStatusEnum;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record TaskDTO(
        UUID id,
        UUID projectId,
        String title,
        String description,
        TaskStatusEnum status,
        TaskPriorityEnum priority,
        LocalDate deadline,
        LocalDate endDate,
        UUID assigneeId,
        String assigneeEmail,
        String assigneeUsername,
        LocalDateTime createdAt
) {}
