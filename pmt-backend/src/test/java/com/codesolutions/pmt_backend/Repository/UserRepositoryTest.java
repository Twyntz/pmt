package com.codesolutions.pmt_backend.Repository;

import com.codesolutions.pmt_backend.Entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
public class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    void saveAndFindByIdAndEmail() {
        User u = new User();
        u.setUsername("alice");
        u.setEmail("alice@example.com");
        u.setPassword("pwd");
        User saved = userRepository.save(u);

        assertNotNull(saved.getId());
        assertEquals("alice", saved.getUsername());

        Optional<User> byId = userRepository.findById(saved.getId());
        assertTrue(byId.isPresent());

        Optional<User> byEmail = userRepository.findByEmail("alice@example.com");
        assertTrue(byEmail.isPresent());
        assertEquals(saved.getId(), byEmail.get().getId());
    }
}
