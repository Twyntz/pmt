package com.codesolutions.pmt_backend.Controller;

import com.codesolutions.pmt_backend.Entity.Project;
import com.codesolutions.pmt_backend.Entity.ProjectMember;
import com.codesolutions.pmt_backend.Entity.User;
import com.codesolutions.pmt_backend.Repository.ProjectMemberRepository;
import com.codesolutions.pmt_backend.Repository.ProjectRepository;
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
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * IT pour ProjectMemberController :
 * - GET /api/project-members (liste)
 * - GET /api/project-members/{id} (détail)
 * - POST /api/project-members (création OK et payload invalide)
 * - GET id inconnu -> 404 (via GlobalExceptionHandler)
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class ProjectMemberControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProjectMemberRepository memberRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private static UUID projectId;
    private static UUID ownerId;
    private static UUID userId;       // le membre à inviter
    private static UUID memberId;     // id du ProjectMember créé

    private static String uniqueOwnerEmail;
    private static String uniqueUserEmail;

    @BeforeAll
    static void initStatics() {
        projectId = null;
        ownerId = null;
        userId = null;
        memberId = null;
        uniqueOwnerEmail = "owner-" + UUID.randomUUID() + "@example.com";
        uniqueUserEmail = "user-" + UUID.randomUUID() + "@example.com";
    }

    private User seedOwner() {
        User u = new User();
        u.setUsername("owner-member");
        u.setEmail(uniqueOwnerEmail);
        u.setPassword("pwd");
        return userRepository.save(u);
    }

    private Project seedProject(User owner) {
        Project p = new Project();
        p.setName("Projet Members");
        p.setDescription("Projet pour tests ProjectMemberController");
        p.setStartDate(LocalDate.now());
        p.setOwner(owner);
        return projectRepository.save(p);
    }

    private User seedUser() {
        User u = new User();
        u.setUsername("member-user");
        u.setEmail(uniqueUserEmail);
        u.setPassword("pwd");
        return userRepository.save(u);
    }

    @Test
    @Order(1)
    void seedData_project_and_user() {
        User owner = seedOwner();
        ownerId = owner.getId();

        Project project = seedProject(owner);
        projectId = project.getId();

        User memberUser = seedUser();
        userId = memberUser.getId();

        assertNotNull(projectId);
        assertNotNull(userId);
    }

    @Test
    @Order(2)
    void postAddMember_valid_returns200_andPersists() throws Exception {
        String payload = """
        {
          "project": { "id": "%s" },
          "user": { "id": "%s" },
          "role": "MEMBER"
        }
        """.formatted(projectId, userId);

        String resp = mockMvc.perform(post("/api/project-members")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk()) // le controller renvoie 200 OK (pas 201)
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.project.id").value(projectId.toString()))
                .andExpect(jsonPath("$.user.id").value(userId.toString()))
                .andExpect(jsonPath("$.role", anyOf(is("MEMBER"), notNullValue())))
                .andReturn().getResponse().getContentAsString();

        JsonNode json = MAPPER.readTree(resp);
        memberId = UUID.fromString(json.get("id").asText());
        assertNotNull(memberId);

        // Sanity check DB
        ProjectMember saved = memberRepository.findById(memberId).orElseThrow();
        assertEquals(projectId, saved.getProject().getId());
        assertEquals(userId, saved.getUser().getId());
    }

    @Test
    @Order(3)
    void getAllMembers_returnsNonEmptyList() throws Exception {
        mockMvc.perform(get("/api/project-members").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", not(empty())))
                .andExpect(jsonPath("$[0].id", notNullValue()));
    }

    @Test
    @Order(4)
    void getById_returnsEntity() throws Exception {
        assertNotNull(memberId);

        mockMvc.perform(get("/api/project-members/{id}", memberId).accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(memberId.toString()))
                .andExpect(jsonPath("$.project.id").value(projectId.toString()))
                .andExpect(jsonPath("$.user.id").value(userId.toString()));
    }

    @Test
    @Order(5)
    void getById_notFound_returns404() throws Exception {
        UUID randomId = UUID.randomUUID();

        mockMvc.perform(get("/api/project-members/{id}", randomId).accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.message", containsStringIgnoringCase("non trouvé")));
    }

    @Test
    @Order(6)
    void postAddMember_invalidPayload_returns400() throws Exception {
        // payload sans project ni user -> violera les contraintes JPA -> handler global => 400
        String payload = """
        { "role": "MEMBER" }
        """;

        mockMvc.perform(post("/api/project-members")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON));
    }
}
