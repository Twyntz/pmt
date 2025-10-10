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

import java.net.URI;
import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class ProjectControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectMemberRepository memberRepository;

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private static UUID ownerId;
    private static UUID projectId;
    private static String inviteeEmail = "invitee@example.com";

    @BeforeAll
    static void initStatics() {
        ownerId = null;
        projectId = null;
    }

    private User seedOwner() {
        User owner = new User();
        owner.setUsername("owner-ctrl");
        owner.setEmail("owner-ctrl@example.com");
        owner.setPassword("pwd");
        return userRepository.save(owner);
    }

    private User seedInvitee() {
        User u = new User();
        u.setUsername("invitee");
        u.setEmail(inviteeEmail);
        u.setPassword("pwd");
        return userRepository.save(u);
    }

    @Test
    @Order(1)
    void postCreateProject_validPayload_returns201AndDto() throws Exception {
        User owner = seedOwner();
        ownerId = owner.getId();

        String body = """
        {
          "name": "Projet Ctrl",
          "description": "Projet de test contrôleur",
          "startDate": "%s",
          "ownerId": "%s"
        }
        """.formatted(LocalDate.now(), ownerId);

        String response = mockMvc.perform(post("/api/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", startsWith("/api/projects/")))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.name").value("Projet Ctrl"))
                .andExpect(jsonPath("$.ownerId").value(ownerId.toString()))
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = MAPPER.readTree(response);
        projectId = UUID.fromString(json.get("id").asText());
        assertNotNull(projectId, "Le projet créé doit avoir un ID");
    }

    @Test
    @Order(2)
    void getAllProjects_returnsListWithProject() throws Exception {
        mockMvc.perform(get("/api/projects").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", not(empty())))
                .andExpect(jsonPath("$[0].id", notNullValue()))
                .andExpect(jsonPath("$[0].name", not(isEmptyOrNullString())));
    }

    @Test
    @Order(3)
    void getProjectById_returnsDto() throws Exception {
        assertNotNull(projectId, "Un projet doit exister pour ce test");
        mockMvc.perform(get("/api/projects/{id}", projectId).accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(projectId.toString()))
                .andExpect(jsonPath("$.name", not(isEmptyOrNullString())));
    }

    @Test
    @Order(4)
    void postCreateProject_invalidPayload_missingNameOrOwner_returns400() throws Exception {
        // payload vide
        mockMvc.perform(post("/api/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid payload"));

        // name trop court
        String shortName = """
        { "name":"ab", "ownerId":"%s" }
        """.formatted(ownerId);
        mockMvc.perform(post("/api/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(shortName))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid payload"));

        // owner inexistant
        String badOwner = """
        { "name":"OkName", "ownerId":"%s" }
        """.formatted(UUID.randomUUID());
        mockMvc.perform(post("/api/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(badOwner))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Owner not found"));
    }

    @Test
    @Order(5)
    void listMembers_initiallyEmpty_returns200EmptyArray() throws Exception {
        assertNotNull(projectId);

        mockMvc.perform(get("/api/projects/{id}/members", projectId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @Order(6)
    void inviteByEmail_missingEmail_returns400() throws Exception {
        assertNotNull(projectId);

        mockMvc.perform(post("/api/projects/{id}/invite", projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Email required"));
    }

    @Test
    @Order(7)
    void inviteByEmail_projectNotFound_returns404() throws Exception {
        UUID randomProject = UUID.randomUUID();
        String body = """
        { "email":"%s" }
        """.formatted(inviteeEmail);

        mockMvc.perform(post("/api/projects/{id}/invite", randomProject)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Project not found"));
    }

    @Test
    @Order(8)
    void inviteByEmail_userNotFound_returns404() throws Exception {
        assertNotNull(projectId);
        // pas de seed de l'email -> 404
        String body = """
        { "email":"ghost@example.com" }
        """;

        mockMvc.perform(post("/api/projects/{id}/invite", projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("User not found"));
    }

    @Test
    @Order(9)
    void inviteByEmail_success_returns201AndMemberDto() throws Exception {
        assertNotNull(projectId);
        // créer l'utilisateur invité
        seedInvitee();

        String body = """
        { "email":"%s", "role":"MEMBER" }
        """.formatted(inviteeEmail);

        String response = mockMvc.perform(post("/api/projects/{id}/invite", projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", startsWith("/api/projects/")))
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.projectId").value(projectId.toString()))
                .andExpect(jsonPath("$.email").value(inviteeEmail))
                .andExpect(jsonPath("$.role", anyOf(is("MEMBER"), notNullValue())))
                .andReturn()
                .getResponse()
                .getContentAsString();

        // vérification en DB que le membre est bien créé
        JsonNode json = MAPPER.readTree(response);
        UUID memberId = UUID.fromString(json.get("id").asText());
        ProjectMember m = memberRepository.findById(memberId).orElseThrow();
        assertEquals(inviteeEmail, m.getUser().getEmail());
    }

    @Test
    @Order(10)
    void inviteByEmail_duplicate_returns409() throws Exception {
        assertNotNull(projectId);

        String body = """
        { "email":"%s" }
        """.formatted(inviteeEmail);

        mockMvc.perform(post("/api/projects/{id}/invite", projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Already a member"));
    }

    @Test
    @Order(11)
    void listMembers_afterInvite_returnsOneMember() throws Exception {
        assertNotNull(projectId);

        mockMvc.perform(get("/api/projects/{id}/members", projectId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].projectId").value(projectId.toString()))
                .andExpect(jsonPath("$[0].email").value(inviteeEmail));
    }

    @Test
    @Order(12)
    void listMembers_projectNotFound_returns404() throws Exception {
        UUID randomId = UUID.randomUUID();

        mockMvc.perform(get("/api/projects/{id}/members", randomId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Project not found"));
    }

    // Sanity check : l'autre mapping racine (sans /api) fonctionne aussi pour GET list
    @Test
    @Order(13)
    void getAllProjects_onAltPrefix_returnsList() throws Exception {
        mockMvc.perform(get("/projects").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", not(empty())));
    }
}
