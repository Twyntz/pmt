package com.codesolutions.pmt_backend.DTO;

import java.time.LocalDateTime;
import java.util.UUID;

public record ProjectMemberDTO(
        UUID id,
        UUID projectId,
        UUID userId,
        String username,
        String email,
        String role,
        LocalDateTime createdAt
) {}
