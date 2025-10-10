package com.codesolutions.pmt_backend.Controller;

import com.codesolutions.pmt_backend.Entity.*;
import com.codesolutions.pmt_backend.Repository.ProjectRepository;
import com.codesolutions.pmt_backend.Repository.TaskHistoryRepository;
import com.codesolutions.pmt_backend.Repository.TaskRepository;
import com.codesolutions.pmt_backend.Repository.UserRepository;
import com.codesolutions.pmt_backend.Service.MailService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

// ⚠️ Pas d'import statique de Mockito.* pour éviter les collisions avec Hamcrest
// On utilisera Mockito.verify(...), Mockito.reset(...), ArgumentMatchers.any(...)

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class TaskControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TaskRepository taskRepo;

    @Autowired
    private ProjectRepository projectRepo;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private TaskHistoryRepository historyRepo;

    @MockBean
    private MailService mailService; // mock : pas d’envoi réel

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private static UUID projectId;
    private static UUID ownerId;
    private static UUID createdTaskId;

    private static String assigneeEmail = "assignee@example.com";
    private static UUID assigneeId;

    @BeforeAll
    static void initStatics() {
        projectId = null;
        ownerId = null;
        createdTaskId = null;
        assigneeId = null;
    }

    /** Seed d’un owner avec email UNIQUE pour éviter la contrainte d’unicité H2. */
    private User seedOwner(String tag) {
        User owner = new User();
        owner.setUsername("owner-" + tag);
        // email unique par tag pour contourner la contrainte unique
        owner.setEmail(("owner-" + tag + "@example.com"));
        owner.setPassword("pwd");
        return userRepo.save(owner);
    }

    private Project seedProject(User owner) {
        Project p = new Project();
        p.setName("Projet Tasks");
        p.setDescription("Projet pour tests TaskController");
        p.setStartDate(LocalDate.now());
        p.setOwner(owner);
        return projectRepo.save(p);
    }

    private User seedAssignee() {
        User u = new User();
        u.setUsername("assignee");
        u.setEmail(assigneeEmail);
        u.setPassword("pwd");
        return userRepo.save(u);
    }

    @Test
    @Order(1)
    void seedProjectAndAssignee() {
        User owner = seedOwner("main");
        ownerId = owner.getId();
        Project p = seedProject(owner);
        projectId = p.getId();

        User assignee = seedAssignee();
        assigneeId = assignee.getId();

        assertNotNull(projectId);
        assertNotNull(assigneeId);
    }

    @Test
    @Order(2)
    void listInitiallyEmpty_returns200EmptyArray() throws Exception {
        mockMvc.perform(get("/api/projects/{pid}/tasks", projectId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @Order(3)
    void createTask_minimal_valid_returns201_andCreatesHistory() throws Exception {
        String payload = """
        {
          "title": "Créer une tâche",
          "description": "Desc",
          "status": "TODO",
          "priority": "HIGH",
          "deadline": "%s"
        }
        """.formatted(LocalDate.now().plusDays(5));

        String resp = mockMvc.perform(post("/api/projects/{pid}/tasks", projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                // ⚠️ Qualifier startsWith vient de Hamcrest
                .andExpect(header().string("Location",
                        org.hamcrest.Matchers.startsWith("/api/projects/" + projectId + "/tasks/")))
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.projectId").value(projectId.toString()))
                .andExpect(jsonPath("$.title").value("Créer une tâche"))
                .andReturn().getResponse().getContentAsString();

        JsonNode json = MAPPER.readTree(resp);
        createdTaskId = UUID.fromString(json.get("id").asText());
        assertNotNull(createdTaskId);

        // Une entrée d'historique doit exister (CREATED: ...)
        long historyCount = historyRepo.findByTaskIdOrderByChangedAtDesc(createdTaskId).size();
        assertTrue(historyCount >= 1, "L'historique doit contenir au moins une entrée après la création");
    }

    @Test
    @Order(4)
    void getOne_returns200_withDto() throws Exception {
        assertNotNull(createdTaskId);
        mockMvc.perform(get("/api/projects/{pid}/tasks/{tid}", projectId, createdTaskId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(createdTaskId.toString()))
                .andExpect(jsonPath("$.projectId").value(projectId.toString()));
    }

    @Test
    @Order(5)
    void history_returns200_list() throws Exception {
        assertNotNull(createdTaskId);
        mockMvc.perform(get("/api/projects/{pid}/tasks/{tid}/history", projectId, createdTaskId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", not(empty())));
    }

    @Test
    @Order(6)
    void getOne_wrongProject_returns404() throws Exception {
        // 🔧 owner avec email unique pour éviter la violation d’unicité
        UUID otherProject = seedProject(seedOwner("other1")).getId();

        mockMvc.perform(get("/api/projects/{pid}/tasks/{tid}", otherProject, createdTaskId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Task not found"));
    }

    @Test
    @Order(7)
    void createTask_projectNotFound_returns404() throws Exception {
        String payload = """
        { "title":"ABC" }
        """;
        mockMvc.perform(post("/api/projects/{pid}/tasks", UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Project not found"));
    }

    @Test
    @Order(8)
    void createTask_invalidPayload_returns400() throws Exception {
        String payload = """
        { "title": "ab" }  // trop court
        """;
        mockMvc.perform(post("/api/projects/{pid}/tasks", projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid payload"));
    }

    @Test
    @Order(9)
    void createTask_withAssigneeEmail_sendsMail_returns201() throws Exception {
        Mockito.reset(mailService); // on veut compter juste cet envoi

        String payload = """
        {
          "title": "Tâche assignée",
          "assigneeEmail": "%s",
          "changedBy": "%s"
        }
        """.formatted(assigneeEmail, ownerId);

        String resp = mockMvc.perform(post("/api/projects/{pid}/tasks", projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Tâche assignée"))
                .andExpect(jsonPath("$.assigneeEmail").value(assigneeEmail))
                .andReturn().getResponse().getContentAsString();

        // Vérifie l’appel d’envoi du mail d’assignation (qualifié pour éviter collision)
        Mockito.verify(mailService, Mockito.atLeastOnce())
                .sendTaskAssignedMail(
                        org.mockito.ArgumentMatchers.any(User.class),
                        org.mockito.ArgumentMatchers.any(Task.class),
                        org.mockito.ArgumentMatchers.anyString()
                );
    }

    @Test
    @Order(10)
    void createTask_withAssigneeIdNotFound_returns400() throws Exception {
        String payload = """
        {
          "title": "Tâche invalide",
          "assigneeId": "%s"
        }
        """.formatted(UUID.randomUUID());

        mockMvc.perform(post("/api/projects/{pid}/tasks", projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid assignee"))
                .andExpect(jsonPath("$.details", containsStringIgnoringCase("assigneeId not found")));
    }

    @Test
    @Order(11)
    void update_changesFields_andCreatesHistory_andMaySendMail() throws Exception {
        assertNotNull(createdTaskId);
        Mockito.reset(mailService);

        String payload = """
        {
          "title": "Titre modifié",
          "description": "Nouvelle description",
          "status": "IN_PROGRESS",
          "priority": "LOW",
          "deadline": "%s",
          "endDate": "%s",
          "assigneeEmail": "%s",
          "changedBy": "%s"
        }
        """.formatted(LocalDate.now().plusDays(10), LocalDate.now().plusDays(12), assigneeEmail, ownerId);

        String resp = mockMvc.perform(patch("/api/projects/{pid}/tasks/{tid}", projectId, createdTaskId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Titre modifié"))
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.priority").value("LOW"))
                .andExpect(jsonPath("$.assigneeEmail").value(assigneeEmail))
                .andReturn().getResponse().getContentAsString();

        JsonNode json = MAPPER.readTree(resp);
        assertEquals(createdTaskId.toString(), json.get("id").asText());

        // L'historique doit avoir au moins 2 événements (CREATED + UPDATED)
        var history = historyRepo.findByTaskIdOrderByChangedAtDesc(createdTaskId);
        assertTrue(history.size() >= 2, "Il doit y avoir au moins 2 entrées d'historique");

        Mockito.verify(mailService, Mockito.atLeastOnce())
                .sendTaskAssignedMail(
                        org.mockito.ArgumentMatchers.any(User.class),
                        org.mockito.ArgumentMatchers.any(Task.class),
                        org.mockito.ArgumentMatchers.anyString()
                );
    }

    @Test
    @Order(12)
    void update_wrongProject_returns404() throws Exception {
        // 🔧 owner avec email unique pour éviter la violation d’unicité
        UUID otherProject = seedProject(seedOwner("other2")).getId();

        mockMvc.perform(patch("/api/projects/{pid}/tasks/{tid}", otherProject, createdTaskId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"X\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Task not found"));
    }
}
