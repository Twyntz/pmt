package com.codesolutions.pmt_backend.Controller;

import com.codesolutions.pmt_backend.Entity.User;
import com.codesolutions.pmt_backend.Repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * IT pour AuthController.register :
 * - POST /api/auth/register : 201 créé
 * - payload manquant : 400
 * - email déjà existant : 409
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class AuthControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private static String uniqueEmailOk;     // pour le cas succès
    private static String duplicateEmail;    // pour le cas 409
    private static String usernameOk;

    @BeforeAll
    static void init() {
        uniqueEmailOk = "auth-" + UUID.randomUUID() + "@example.com";
        duplicateEmail = "dupe-" + UUID.randomUUID() + "@example.com";
        usernameOk = "new-user-" + UUID.randomUUID().toString().substring(0, 8);
    }

    @Test
    @Order(1)
    void register_success_returns201_andUserDTO() throws Exception {
        String payload = """
        {
          "username": "%s",
          "email": "%s",
          "password": "secret"
        }
        """.formatted(usernameOk, uniqueEmailOk);

        String resp = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", org.hamcrest.Matchers.startsWith("/users/")))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.username").value(usernameOk))
                .andExpect(jsonPath("$.email").value(uniqueEmailOk))
                .andReturn().getResponse().getContentAsString();

        JsonNode json = MAPPER.readTree(resp);
        String idStr = json.get("id").asText();
        assertDoesNotThrow(() -> UUID.fromString(idStr));

        // Sanity check DB
        User saved = userRepository.findById(UUID.fromString(idStr)).orElseThrow();
        assertEquals(uniqueEmailOk, saved.getEmail());
        assertNotNull(saved.getCreatedAt());
    }

    @Test
    @Order(2)
    void register_missingFields_returns400() throws Exception {
        // email manquant
        String payloadMissing = """
        {
          "username": "x",
          "password": "x"
        }
        """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadMissing))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Missing fields"));
    }

    @Test
    @Order(3)
    void register_duplicateEmail_returns409() throws Exception {
        // seed d’un user avec duplicateEmail
        User existing = new User();
        existing.setUsername("dupe-user");
        existing.setEmail(duplicateEmail);
        existing.setPassword("pwd");
        existing.setCreatedAt(LocalDateTime.now());
        existing = userRepository.save(existing);
        assertNotNull(existing.getId());

        String payload = """
        {
          "username": "someone",
          "email": "%s",
          "password": "pwd"
        }
        """.formatted(duplicateEmail);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Email already exists"));
    }
}
