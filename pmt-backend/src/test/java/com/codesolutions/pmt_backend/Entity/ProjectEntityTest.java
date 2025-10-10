package com.codesolutions.pmt_backend.Entity;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

public class ProjectEntityTest {

    @Test
    void testGettersSetters_BasicFields() {
        Project p = new Project();

        UUID id = UUID.randomUUID();
        User owner = new User();
        owner.setUsername("owner1");
        owner.setEmail("owner1@example.com");
        owner.setPassword("pwd");

        p.setId(id);
        p.setName("PMT Backend");
        p.setDescription("Développement et tests");
        p.setStartDate(LocalDate.of(2025, 1, 15));
        p.setOwner(owner);

        assertEquals(id, p.getId());
        assertEquals("PMT Backend", p.getName());
        assertEquals("Développement et tests", p.getDescription());
        assertEquals(LocalDate.of(2025, 1, 15), p.getStartDate());
        assertNotNull(p.getOwner());
        assertEquals("owner1", p.getOwner().getUsername());
    }

    @Test
    void testCreatedAt_DefaultAndOverride() {
        Project p = new Project();

        // La plupart des entités du projet initialisent createdAt à now()
        assertNotNull(p.getCreatedAt(), "createdAt doit être initialisé par défaut sur Project");

        LocalDateTime custom = LocalDateTime.now().minusDays(1);
        p.setCreatedAt(custom);
        assertEquals(custom, p.getCreatedAt());
    }

    @Test
    void testOwnerCanBeChanged() {
        Project p = new Project();

        User u1 = new User();
        u1.setUsername("alice");
        u1.setEmail("alice@example.com");
        u1.setPassword("pwd");

        User u2 = new User();
        u2.setUsername("bob");
        u2.setEmail("bob@example.com");
        u2.setPassword("pwd");

        p.setOwner(u1);
        assertEquals("alice", p.getOwner().getUsername());

        p.setOwner(u2);
        assertEquals("bob", p.getOwner().getUsername());
    }

    @Test
    void testStartDateCanBeChanged() {
        Project p = new Project();

        p.setStartDate(LocalDate.of(2025, 3, 1));
        assertEquals(LocalDate.of(2025, 3, 1), p.getStartDate());

        p.setStartDate(LocalDate.of(2025, 4, 1));
        assertEquals(LocalDate.of(2025, 4, 1), p.getStartDate());
    }

    @Test
    void testIdIsNullByDefault() {
        Project p = new Project();
        assertNull(p.getId(), "L'ID doit être null tant que l'entité n'est pas persistée");
    }
}
