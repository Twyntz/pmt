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

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class UserControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private static UUID createdUserId;
    private static String uniqueEmail;

    @BeforeAll
    static void initStatics() {
        createdUserId = null;
        uniqueEmail = "user-" + UUID.randomUUID() + "@example.com";
    }

    @Test
    @Order(1)
    void createUser_returns200_withGeneratedId() throws Exception {
        String payload = """
        {
          "username": "john-doe",
          "email": "%s",
          "password": "pwd"
        }
        """.formatted(uniqueEmail);

        String resp = mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.email").value(uniqueEmail))
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = MAPPER.readTree(resp);
        createdUserId = UUID.fromString(json.get("id").asText());
        assertNotNull(createdUserId);

        User saved = userRepository.findById(createdUserId).orElseThrow();
        assertEquals(uniqueEmail, saved.getEmail());
    }

    @Test
    @Order(2)
    void getAllUsers_returnsNonEmptyList() throws Exception {
        mockMvc.perform(get("/api/users").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", not(empty())))
                .andExpect(jsonPath("$[0].id", notNullValue()));
    }

    @Test
    @Order(3)
    void getUserById_returnsEntity() throws Exception {
        assertNotNull(createdUserId);

        mockMvc.perform(get("/api/users/{id}", createdUserId).accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(createdUserId.toString()))
                .andExpect(jsonPath("$.email").value(uniqueEmail));
    }

    @Test
    @Order(4)
    void getUserById_notFound_returns404() throws Exception {
        UUID randomId = UUID.randomUUID();
        mockMvc.perform(get("/api/users/{id}", randomId).accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.message", containsStringIgnoringCase("non trouvé")));
    }
}
