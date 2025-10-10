package com.codesolutions.pmt_backend.Service;

import com.codesolutions.pmt_backend.Entity.Project;
import com.codesolutions.pmt_backend.Entity.ProjectMember;
import com.codesolutions.pmt_backend.Entity.User;
import com.codesolutions.pmt_backend.Repository.ProjectMemberRepository;
import com.codesolutions.pmt_backend.Repository.ProjectRepository;
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
public class ProjectMemberServiceIT {

    @Autowired
    private ProjectMemberService projectMemberService;

    @Autowired
    private ProjectMemberRepository projectMemberRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    private static UUID createdMemberId;

    private Project createProjectWithOwner() {
        User owner = new User();
        owner.setUsername("pm-owner");
        owner.setEmail("pm-owner@example.com");
        owner.setPassword("pwd");
        owner = userRepository.save(owner);

        Project project = new Project();
        project.setName("Projet Membre");
        project.setDescription("Projet pour test membre");
        project.setStartDate(LocalDate.now());
        project.setOwner(owner); // ✅ NOT NULL
        return projectRepository.save(project);
    }

    private User createUser(String uname, String email) {
        User u = new User();
        u.setUsername(uname);
        u.setEmail(email);
        u.setPassword("pwd");
        return userRepository.save(u);
    }

    @Test
    @Order(1)
    void testAddMember() {
        Project project = createProjectWithOwner();
        User user = createUser("member1", "member1@example.com");

        ProjectMember member = new ProjectMember();
        member.setRole("MEMBER");   // String
        member.setProject(project); // ✅ project_id NOT NULL
        member.setUser(user);       // ✅ user_id NOT NULL

        ProjectMember saved = projectMemberService.addMember(member);

        assertNotNull(saved.getId(), "L'ID du membre doit être généré");
        assertEquals("MEMBER", saved.getRole());
        assertNotNull(saved.getProject());
        assertNotNull(saved.getUser());

        createdMemberId = saved.getId();
    }

    @Test
    @Order(2)
    void testGetById() {
        assertNotNull(createdMemberId, "Un membre doit être créé avant ce test");

        ProjectMember found = projectMemberService.getById(createdMemberId);
        assertNotNull(found, "Le membre doit exister");
        assertEquals("MEMBER", found.getRole());
    }

    @Test
    @Order(3)
    void testGetAllMembers() {
        List<ProjectMember> members = projectMemberService.getAll();
        assertFalse(members.isEmpty(), "La liste des membres ne doit pas être vide");
    }

    @Test
    @Order(4)
    void testMemberNotFoundByRandomId() {
        UUID randomId = UUID.randomUUID();
        Optional<ProjectMember> memberOpt = projectMemberRepository.findById(randomId);
        assertTrue(memberOpt.isEmpty(), "Aucun membre ne doit être trouvé pour cet UUID aléatoire");
    }
}
