package com.codesolutions.pmt_backend.Repository;

import com.codesolutions.pmt_backend.Entity.Project;
import com.codesolutions.pmt_backend.Entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
public class ProjectRepositoryTest {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void saveAndFind() {
        User owner = new User();
        owner.setUsername("owner");
        owner.setEmail("owner@example.com");
        owner.setPassword("pwd");
        owner = userRepository.save(owner);

        Project p = new Project();
        p.setName("Projet A");
        p.setDescription("Desc A");
        p.setStartDate(LocalDate.now());
        p.setOwner(owner); // NOT NULL
        Project saved = projectRepository.save(p);

        assertNotNull(saved.getId());
        Optional<Project> found = projectRepository.findById(saved.getId());
        assertTrue(found.isPresent());
        assertEquals("Projet A", found.get().getName());
        assertNotNull(found.get().getOwner());
    }
}
