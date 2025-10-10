package com.codesolutions.pmt_backend.Service;

import com.codesolutions.pmt_backend.Entity.User;
import com.codesolutions.pmt_backend.Repository.UserRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class UserServiceIT {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    private static UUID createdUserId;

    @Test
    @Order(1)
    void testCreateUser() {
        User user = new User();
        user.setUsername("alice");
        user.setEmail("alice@example.com");
        user.setPassword("password123");

        User saved = userService.createUser(user);

        assertNotNull(saved.getId(), "L'ID doit être généré");
        assertEquals("alice", saved.getUsername());
        assertEquals("alice@example.com", saved.getEmail());

        createdUserId = saved.getId();
    }

    @Test
    @Order(2)
    void testGetUserById() {
        assertNotNull(createdUserId, "L'utilisateur doit avoir été créé avant ce test");

        User found = userService.getUserById(createdUserId);
        assertNotNull(found, "L'utilisateur doit être trouvé");
        assertEquals("alice", found.getUsername());
    }

    @Test
    @Order(3)
    void testGetAllUsers() {
        List<User> users = userService.getAllUsers();
        assertFalse(users.isEmpty(), "La liste des utilisateurs ne doit pas être vide");
    }

    @Test
    @Order(4)
    void testUserNotFoundByRandomId() {
        UUID randomId = UUID.randomUUID();
        Optional<User> userOpt = userRepository.findById(randomId);
        assertTrue(userOpt.isEmpty(), "Aucun utilisateur ne doit être trouvé pour cet UUID aléatoire");
    }
}
