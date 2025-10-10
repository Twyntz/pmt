package com.codesolutions.pmt_backend.Entity;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

public class UserEntityTest {

    @Test
    void testGettersSetters_IdUsernameEmailPassword() {
        User u = new User();

        UUID id = UUID.randomUUID();
        u.setId(id);
        u.setUsername("alice");
        u.setEmail("alice@example.com");
        u.setPassword("pwd123");

        assertEquals(id, u.getId());
        assertEquals("alice", u.getUsername());
        assertEquals("alice@example.com", u.getEmail());
        assertEquals("pwd123", u.getPassword());
    }

    @Test
    void testCreatedAt_DefaultAndOverride() {
        User u = new User();
        // valeur par défaut possible via champ initialisé dans l'entité
        assertNotNull(u.getCreatedAt(), "createdAt doit être initialisé par défaut (ou non-null après set)");

        LocalDateTime now = LocalDateTime.now();
        u.setCreatedAt(now);
        assertEquals(now, u.getCreatedAt());
    }

    @Test
    void testMutabilityAndIndependence() {
        User u1 = new User();
        User u2 = new User();

        u1.setUsername("alice");
        u2.setUsername("bob");

        assertNotEquals(u1.getUsername(), u2.getUsername());
        assertNull(u1.getId(), "Pas d'ID si non persisté");
        assertNull(u2.getId(), "Pas d'ID si non persisté");
    }

    @Test
    void testEmailCanBeChanged() {
        User u = new User();
        u.setEmail("old@example.com");
        assertEquals("old@example.com", u.getEmail());

        u.setEmail("new@example.com");
        assertEquals("new@example.com", u.getEmail());
    }
}
