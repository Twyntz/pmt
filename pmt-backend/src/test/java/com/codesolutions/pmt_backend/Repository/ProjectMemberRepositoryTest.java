package com.codesolutions.pmt_backend.Repository;

import com.codesolutions.pmt_backend.Entity.Project;
import com.codesolutions.pmt_backend.Entity.ProjectMember;
import com.codesolutions.pmt_backend.Entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
public class ProjectMemberRepositoryTest {

    @Autowired
    private ProjectMemberRepository projectMemberRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    private Project createProjectWithOwner() {
        User owner = new User();
        owner.setUsername("owner4");
        owner.setEmail("owner4@example.com");
        owner.setPassword("pwd");
        owner = userRepository.save(owner);

        Project p = new Project();
        p.setName("Projet Membre");
        p.setDescription("Desc M");
        p.setStartDate(LocalDate.now());
        p.setOwner(owner);
        return projectRepository.save(p);
    }

    private User createUser(String uname, String email) {
        User u = new User();
        u.setUsername(uname);
        u.setEmail(email);
        u.setPassword("pwd");
        return userRepository.save(u);
    }

    @Test
    void saveAndFind() {
        Project p = createProjectWithOwner();
        User u = createUser("membre", "membre@example.com");

        ProjectMember pm = new ProjectMember();
        pm.setProject(p); // NOT NULL
        pm.setUser(u);    // NOT NULL
        pm.setRole("MEMBER");

        ProjectMember saved = projectMemberRepository.save(pm);
        assertNotNull(saved.getId());

        Optional<ProjectMember> found = projectMemberRepository.findById(saved.getId());
        assertTrue(found.isPresent());
        assertEquals("MEMBER", found.get().getRole());
        assertNotNull(found.get().getProject());
        assertNotNull(found.get().getUser());
    }
}
