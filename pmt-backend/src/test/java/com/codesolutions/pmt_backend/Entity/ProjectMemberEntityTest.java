package com.codesolutions.pmt_backend.Entity;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

public class ProjectMemberEntityTest {

    @Test
    void testGettersSetters_CoreFields() {
        ProjectMember pm = new ProjectMember();

        UUID id = UUID.randomUUID();
        Project project = new Project();
        project.setName("Projet Membre");

        User user = new User();
        user.setUsername("membre1");
        user.setEmail("membre1@example.com");
        user.setPassword("pwd");

        pm.setId(id);
        pm.setProject(project);
        pm.setUser(user);
        pm.setRole("MEMBER");

        assertEquals(id, pm.getId());
        assertNotNull(pm.getProject());
        assertEquals("Projet Membre", pm.getProject().getName());
        assertNotNull(pm.getUser());
        assertEquals("membre1", pm.getUser().getUsername());
        assertEquals("MEMBER", pm.getRole());
    }

    @Test
    void testCreatedAt_DefaultAndOverride() {
        ProjectMember pm = new ProjectMember();

        // créé par défaut dans l’entité (si champ initialisé)
        assertNotNull(pm.getCreatedAt(), "createdAt doit être non null par défaut");

        LocalDateTime custom = LocalDateTime.now().minusHours(2);
        pm.setCreatedAt(custom);
        assertEquals(custom, pm.getCreatedAt());
    }

    @Test
    void testIdIsNullByDefault() {
        ProjectMember pm = new ProjectMember();
        assertNull(pm.getId(), "L'ID doit être null tant que l'entité n'est pas persistée");
    }
}
