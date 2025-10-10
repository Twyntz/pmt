package com.codesolutions.pmt_backend.Controller;

import com.codesolutions.pmt_backend.Entity.Project;
import com.codesolutions.pmt_backend.Entity.Task;
import com.codesolutions.pmt_backend.Entity.TaskPriorityEnum;
import com.codesolutions.pmt_backend.Entity.TaskStatusEnum;
import com.codesolutions.pmt_backend.Entity.TaskHistory;
import com.codesolutions.pmt_backend.Entity.User;
import com.codesolutions.pmt_backend.Repository.ProjectRepository;
import com.codesolutions.pmt_backend.Repository.TaskHistoryRepository;
import com.codesolutions.pmt_backend.Repository.TaskRepository;
import com.codesolutions.pmt_backend.Repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * IT pour TaskHistoryController :
 * - POST /api/task-history (création OK et payload invalide)
 * - GET /api/task-history (liste)
 * - GET /api/task-history/{id} (détail et 404)
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class TaskHistoryControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private TaskHistoryRepository historyRepository;

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private static UUID projectId;
    private static UUID taskId;
    private static UUID changerId;
    private static UUID historyId;

    private static String ownerEmail;
    private static String changerEmail;

    @BeforeAll
    static void initStatics() {
        projectId = null;
        taskId = null;
        changerId = null;
        historyId = null;
        ownerEmail = "owner-" + UUID.randomUUID() + "@example.com";
        changerEmail = "changer-" + UUID.randomUUID() + "@example.com";
    }

    private User seedOwner() {
        User u = new User();
        u.setUsername("owner-history");
        u.setEmail(ownerEmail);
        u.setPassword("pwd");
        return userRepository.save(u);
    }

    private User seedChanger() {
        User u = new User();
        u.setUsername("changer");
        u.setEmail(changerEmail);
        u.setPassword("pwd");
        return userRepository.save(u);
    }

    private Project seedProject(User owner) {
        Project p = new Project();
        p.setName("Projet Historique");
        p.setDescription("Projet pour tests TaskHistoryController");
        p.setStartDate(LocalDate.now());
        p.setOwner(owner);
        return projectRepository.save(p);
    }

    private Task seedTask(Project p) {
        Task t = new Task();
        t.setProject(p);
        t.setTitle("Tâche pour historique");
        t.setDescription("Desc");
        t.setStatus(TaskStatusEnum.TODO);
        t.setPriority(TaskPriorityEnum.MEDIUM);
        t.setDeadline(LocalDate.now().plusDays(2));
        return taskRepository.save(t);
    }

    @Test
    @Order(1)
    void seedData_task_and_changer() {
        User owner = seedOwner();
        Project project = seedProject(owner);
        projectId = project.getId();

        Task task = seedTask(project);
        taskId = task.getId();

        User changer = seedChanger();
        changerId = changer.getId();

        assertNotNull(projectId);
        assertNotNull(taskId);
        assertNotNull(changerId);
    }

    @Test
    @Order(2)
    void postHistory_valid_returns200_andPersists() throws Exception {
        String payload = """
        {
          "task": { "id": "%s" },
          "changeLog": "CREATED",
          "changedBy": { "id": "%s" },
          "changedAt": "%s"
        }
        """.formatted(taskId, changerId, LocalDateTime.now().toString());

        String resp = mockMvc.perform(post("/api/task-history")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk()) // le controller renvoie l'entité directement -> 200
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.task.id").value(taskId.toString()))
                .andExpect(jsonPath("$.changeLog").value("CREATED"))
                .andReturn().getResponse().getContentAsString();

        JsonNode json = MAPPER.readTree(resp);
        historyId = UUID.fromString(json.get("id").asText());
        assertNotNull(historyId);

        // Sanity check DB
        TaskHistory saved = historyRepository.findById(historyId).orElseThrow();
        assertEquals(taskId, saved.getTask().getId());
        assertEquals("CREATED", saved.getChangeLog());
    }

    @Test
    @Order(3)
    void getAll_returnsNonEmptyList() throws Exception {
        mockMvc.perform(get("/api/task-history").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", not(empty())))
                .andExpect(jsonPath("$[0].id", notNullValue()));
    }

    @Test
    @Order(4)
    void getById_returnsEntity() throws Exception {
        assertNotNull(historyId);

        mockMvc.perform(get("/api/task-history/{id}", historyId).accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(historyId.toString()))
                .andExpect(jsonPath("$.task.id").value(taskId.toString()))
                .andExpect(jsonPath("$.changeLog").value("CREATED"));
    }

    @Test
    @Order(5)
    void getById_notFound_returns404() throws Exception {
        UUID randomId = UUID.randomUUID();

        mockMvc.perform(get("/api/task-history/{id}", randomId).accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.message", containsStringIgnoringCase("non trouvé")));
    }

    @Test
    @Order(6)
    void postHistory_invalidPayload_returns400() throws Exception {
        // pas de "task" -> contrainte NOT NULL sur task_id => DataIntegrityViolation => 400 via handler global
        String payload = """
        { "changeLog": "NO_TASK" }
        """;

        mockMvc.perform(post("/api/task-history")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON));
    }
}
