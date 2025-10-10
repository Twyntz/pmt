package com.codesolutions.pmt_backend.Repository;

import com.codesolutions.pmt_backend.Entity.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
public class TaskRepositoryTest {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    private Project createProjectWithOwner() {
        User owner = new User();
        owner.setUsername("owner2");
        owner.setEmail("owner2@example.com");
        owner.setPassword("pwd");
        owner = userRepository.save(owner);

        Project p = new Project();
        p.setName("Projet B");
        p.setDescription("Desc B");
        p.setStartDate(LocalDate.now());
        p.setOwner(owner);
        return projectRepository.save(p);
    }

    @Test
    void saveAndFind() {
        Project project = createProjectWithOwner();

        Task t = new Task();
        t.setProject(project); // NOT NULL
        t.setTitle("Tâche 1");
        t.setDescription("Desc T1");
        t.setStatus(TaskStatusEnum.TODO);
        t.setPriority(TaskPriorityEnum.MEDIUM);
        t.setDeadline(LocalDate.now().plusDays(3));

        Task saved = taskRepository.save(t);
        assertNotNull(saved.getId());

        Optional<Task> found = taskRepository.findById(saved.getId());
        assertTrue(found.isPresent());
        assertEquals("Tâche 1", found.get().getTitle());
        assertEquals(TaskStatusEnum.TODO, found.get().getStatus());
    }
}
