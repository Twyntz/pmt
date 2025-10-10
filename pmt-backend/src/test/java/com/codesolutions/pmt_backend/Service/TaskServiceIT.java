package com.codesolutions.pmt_backend.Service;

import com.codesolutions.pmt_backend.Entity.Project;
import com.codesolutions.pmt_backend.Entity.Task;
import com.codesolutions.pmt_backend.Entity.TaskPriorityEnum;
import com.codesolutions.pmt_backend.Entity.TaskStatusEnum;
import com.codesolutions.pmt_backend.Entity.User;
import com.codesolutions.pmt_backend.Repository.ProjectRepository;
import com.codesolutions.pmt_backend.Repository.TaskRepository;
import com.codesolutions.pmt_backend.Repository.UserRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class TaskServiceIT {

    @Autowired
    private TaskService taskService;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    private static UUID createdTaskId;

    private Project createProjectWithOwner() {
        User owner = new User();
        owner.setUsername("task-owner");
        owner.setEmail("task-owner@example.com");
        owner.setPassword("pwd");
        owner = userRepository.save(owner);

        Project project = new Project();
        project.setName("Projet pour Task");
        project.setDescription("Projet lié à la tâche de test");
        project.setStartDate(LocalDate.now());
        project.setOwner(owner); // ✅ owner_id NOT NULL
        return projectRepository.save(project);
    }

    @Test
    @Order(1)
    void testCreateTask() {
        Project project = createProjectWithOwner();

        Task task = new Task();
        task.setTitle("Développement API");
        task.setDescription("Implémentation des endpoints du backend");
        task.setDeadline(LocalDate.now().plusDays(5));
        task.setPriority(TaskPriorityEnum.HIGH);
        task.setStatus(TaskStatusEnum.TODO);
        task.setProject(project); // ✅ project_id NOT NULL

        Task saved = taskService.createTask(task);

        assertNotNull(saved.getId(), "L'ID de la tâche doit être généré");
        assertEquals("Développement API", saved.getTitle());
        assertEquals(TaskStatusEnum.TODO, saved.getStatus());
        assertEquals(TaskPriorityEnum.HIGH, saved.getPriority());

        createdTaskId = saved.getId();
    }

    @Test
    @Order(2)
    void testGetTaskById() {
        assertNotNull(createdTaskId, "Une tâche doit être créée avant ce test");

        Task found = taskService.getTaskById(createdTaskId);
        assertNotNull(found, "La tâche doit être trouvée");
        assertEquals("Développement API", found.getTitle());
    }

    @Test
    @Order(3)
    void testGetAllTasks() {
        List<Task> tasks = taskService.getAllTasks();
        assertFalse(tasks.isEmpty(), "La liste des tâches ne doit pas être vide");
    }

    @Test
    @Order(4)
    void testTaskNotFoundByRandomId() {
        UUID randomId = UUID.randomUUID();
        Optional<Task> taskOpt = taskRepository.findById(randomId);
        assertTrue(taskOpt.isEmpty(), "Aucune tâche ne doit être trouvée pour cet UUID aléatoire");
    }
}
