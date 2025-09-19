package com.codesolutions.pmt_backend.DTO;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class ProjectDTO {
    private UUID id;
    private String name;
    private String description;
    private LocalDate startDate;
    private UUID ownerId;
    private LocalDateTime createdAt;

    public ProjectDTO() {}

    public ProjectDTO(UUID id, String name, String description, LocalDate startDate, UUID ownerId, LocalDateTime createdAt) {
        this.id = id; this.name = name; this.description = description;
        this.startDate = startDate; this.ownerId = ownerId; this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public UUID getOwnerId() { return ownerId; }
    public void setOwnerId(UUID ownerId) { this.ownerId = ownerId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
