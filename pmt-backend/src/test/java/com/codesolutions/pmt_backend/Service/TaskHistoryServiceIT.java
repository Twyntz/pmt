package com.codesolutions.pmt_backend.Service;

import com.codesolutions.pmt_backend.Entity.Project;
import com.codesolutions.pmt_backend.Entity.Task;
import com.codesolutions.pmt_backend.Entity.TaskStatusEnum;
import com.codesolutions.pmt_backend.Entity.TaskHistory;
import com.codesolutions.pmt_backend.Entity.User;
import com.codesolutions.pmt_backend.Repository.ProjectRepository;
import com.codesolutions.pmt_backend.Repository.TaskHistoryRepository;
import com.codesolutions.pmt_backend.Repository.TaskRepository;
import com.codesolutions.pmt_backend.Repository.UserRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class TaskHistoryServiceIT {

    @Autowired
    private TaskHistoryService taskHistoryService;

    @Autowired
    private TaskHistoryRepository taskHistoryRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    private static UUID createdHistoryId;

    private Task createPersistedTask() {
        // Owner pour le projet
        User owner = new User();
        owner.setUsername("th-owner");
        owner.setEmail("th-owner@example.com");
        owner.setPassword("pwd");
        owner = userRepository.save(owner);

        // Projet
        Project project = new Project();
        project.setName("Projet Historique");
        project.setDescription("Projet pour test TaskHistory");
        project.setStartDate(LocalDate.now());
        project.setOwner(owner);
        project = projectRepository.save(project);

        // Task
        Task task = new Task();
        task.setTitle("Configurer historique");
        task.setStatus(TaskStatusEnum.TODO);
        task.setProject(project);
        task.setDeadline(LocalDate.now().plusDays(1));
        return taskRepository.save(task);
    }

    @Test
    @Order(1)
    void testSaveHistory() {
        Task task = createPersistedTask();

        TaskHistory history = new TaskHistory();
        history.setChangeLog("Création de la tâche");
        history.setChangedAt(LocalDateTime.now());
        history.setTask(task); // ✅ task_id NOT NULL

        TaskHistory saved = taskHistoryService.save(history);

        assertNotNull(saved.getId(), "L'ID de l'historique doit être généré");
        assertEquals("Création de la tâche", saved.getChangeLog());
        assertNotNull(saved.getTask());

        createdHistoryId = saved.getId();
    }

    @Test
    @Order(2)
    void testGetById() {
        assertNotNull(createdHistoryId, "Un historique doit être créé avant ce test");

        TaskHistory found = taskHistoryService.getById(createdHistoryId);
        assertNotNull(found, "L'historique doit être trouvé");
        assertEquals("Création de la tâche", found.getChangeLog());
    }

    @Test
    @Order(3)
    void testGetAllHistories() {
        List<TaskHistory> histories = taskHistoryService.getAll();
        assertFalse(histories.isEmpty(), "La liste des historiques ne doit pas être vide");
    }

    @Test
    @Order(4)
    void testHistoryNotFoundByRandomId() {
        UUID randomId = UUID.randomUUID();
        Optional<TaskHistory> historyOpt = taskHistoryRepository.findById(randomId);
        assertTrue(historyOpt.isEmpty(), "Aucun historique ne doit être trouvé pour cet UUID aléatoire");
    }
}
