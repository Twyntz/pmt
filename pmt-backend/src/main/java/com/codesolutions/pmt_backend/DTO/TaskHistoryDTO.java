package com.codesolutions.pmt_backend.DTO;

import java.time.LocalDateTime;
import java.util.UUID;

public record TaskHistoryDTO(
        UUID id,
        UUID taskId,
        String changeLog,
        UUID changedById,
        String changedByUsername,
        String changedByEmail,
        LocalDateTime changedAt
) {}
