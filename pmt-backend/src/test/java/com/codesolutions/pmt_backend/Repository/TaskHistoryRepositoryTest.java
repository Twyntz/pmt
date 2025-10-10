package com.codesolutions.pmt_backend.Repository;

import com.codesolutions.pmt_backend.Entity.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
public class TaskHistoryRepositoryTest {

    @Autowired
    private TaskHistoryRepository taskHistoryRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    private Task createTask() {
        User owner = new User();
        owner.setUsername("owner3");
        owner.setEmail("owner3@example.com");
        owner.setPassword("pwd");
        owner = userRepository.save(owner);

        Project p = new Project();
        p.setName("Projet C");
        p.setDescription("Desc C");
        p.setStartDate(LocalDate.now());
        p.setOwner(owner);
        p = projectRepository.save(p);

        Task t = new Task();
        t.setProject(p);
        t.setTitle("Tâche historique");
        t.setStatus(TaskStatusEnum.TODO);
        t.setPriority(TaskPriorityEnum.LOW);
        t.setDeadline(LocalDate.now().plusDays(1));
        return taskRepository.save(t);
    }

    @Test
    void saveAndFind() {
        Task task = createTask();

        TaskHistory th = new TaskHistory();
        th.setTask(task); // NOT NULL
        th.setChangeLog("Création");
        th.setChangedAt(LocalDateTime.now());

        TaskHistory saved = taskHistoryRepository.save(th);
        assertNotNull(saved.getId());

        Optional<TaskHistory> found = taskHistoryRepository.findById(saved.getId());
        assertTrue(found.isPresent());
        assertEquals("Création", found.get().getChangeLog());
        assertNotNull(found.get().getTask());
    }
}
