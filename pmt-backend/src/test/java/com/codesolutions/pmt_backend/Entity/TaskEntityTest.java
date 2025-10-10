package com.codesolutions.pmt_backend.Entity;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

public class TaskEntityTest {

    @Test
    void testGettersSetters_CoreFields() {
        Task t = new Task();

        UUID id = UUID.randomUUID();
        Project project = new Project();
        project.setName("Projet X");

        t.setId(id);
        t.setProject(project);
        t.setTitle("Développement API");
        t.setDescription("Implémentation des endpoints");
        t.setStatus(TaskStatusEnum.TODO);
        t.setPriority(TaskPriorityEnum.HIGH);
        t.setDeadline(LocalDate.of(2025, 10, 15));
        t.setEndDate(LocalDate.of(2025, 10, 20));

        assertEquals(id, t.getId());
        assertNotNull(t.getProject());
        assertEquals("Projet X", t.getProject().getName());
        assertEquals("Développement API", t.getTitle());
        assertEquals("Implémentation des endpoints", t.getDescription());
        assertEquals(TaskStatusEnum.TODO, t.getStatus());
        assertEquals(TaskPriorityEnum.HIGH, t.getPriority());
        assertEquals(LocalDate.of(2025, 10, 15), t.getDeadline());
        assertEquals(LocalDate.of(2025, 10, 20), t.getEndDate());
    }

    @Test
    void testAssigneeAndCreatedAt() {
        Task t = new Task();

        User assignee = new User();
        assignee.setUsername("alice");
        assignee.setEmail("alice@example.com");
        assignee.setPassword("pwd");

        t.setAssignee(assignee);
        assertNotNull(t.getAssignee());
        assertEquals("alice", t.getAssignee().getUsername());

        // createdAt est initialisé par défaut dans l'entité
        assertNotNull(t.getCreatedAt(), "createdAt doit être non null par défaut");

        LocalDateTime now = LocalDateTime.now();
        t.setCreatedAt(now);
        assertEquals(now, t.getCreatedAt());
    }

    @Test
    void testDefaults() {
        Task t = new Task();
        // Par défaut dans l'entité : status=TODO, priority=MEDIUM
        assertEquals(TaskStatusEnum.TODO, t.getStatus());
        assertEquals(TaskPriorityEnum.MEDIUM, t.getPriority());
        assertNull(t.getId(), "ID null tant que non persisté");
    }
}
