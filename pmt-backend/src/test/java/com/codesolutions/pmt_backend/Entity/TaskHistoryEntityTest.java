package com.codesolutions.pmt_backend.Entity;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

public class TaskHistoryEntityTest {

    @Test
    void testGettersSetters_CoreFields() {
        TaskHistory th = new TaskHistory();

        UUID id = UUID.randomUUID();

        Project p = new Project();
        p.setName("Projet Historique");
        User owner = new User();
        owner.setUsername("owner");
        owner.setEmail("owner@example.com");
        owner.setPassword("pwd");
        p.setOwner(owner);
        p.setStartDate(LocalDate.now());

        Task t = new Task();
        t.setTitle("Configurer historique");
        t.setProject(p);

        th.setId(id);
        th.setTask(t);
        th.setChangeLog("Création de la tâche");
        LocalDateTime ts = LocalDateTime.now();
        th.setChangedAt(ts);

        assertEquals(id, th.getId());
        assertNotNull(th.getTask());
        assertEquals("Configurer historique", th.getTask().getTitle());
        assertEquals("Création de la tâche", th.getChangeLog());
        assertEquals(ts, th.getChangedAt());
    }

    @Test
    void testDefaultsAndMutability() {
        TaskHistory th = new TaskHistory();

        // changedAt peut être null tant qu'on ne le définit pas
        assertNull(th.getId(), "ID null tant que non persisté");

        th.setChangeLog("Update statut");
        assertEquals("Update statut", th.getChangeLog());

        LocalDateTime now = LocalDateTime.now();
        th.setChangedAt(now);
        assertEquals(now, th.getChangedAt());
    }
}
