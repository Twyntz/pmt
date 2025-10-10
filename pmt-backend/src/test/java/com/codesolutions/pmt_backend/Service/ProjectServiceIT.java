package com.codesolutions.pmt_backend.Service;

import com.codesolutions.pmt_backend.DTO.ProjectDTO;
import com.codesolutions.pmt_backend.Entity.Project;
import com.codesolutions.pmt_backend.Entity.User;
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
public class ProjectServiceIT {

    @Autowired
    private ProjectService projectService;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    private static UUID createdProjectId;

    private User createOwner() {
        User owner = new User();
        owner.setUsername("owner1");
        owner.setEmail("owner1@example.com");
        owner.setPassword("pwd");
        return userRepository.save(owner);
    }

    @Test
    @Order(1)
    void testCreateProject() {
        User owner = createOwner();

        Project project = new Project();
        project.setName("PMT Backend");
        project.setDescription("Développement et test du backend PMT");
        project.setStartDate(LocalDate.now());
        project.setOwner(owner); // ✅ owner_id NOT NULL

        Project saved = projectService.createProject(project);

        assertNotNull(saved.getId(), "L'ID du projet doit être généré");
        assertEquals("PMT Backend", saved.getName());
        assertEquals("Développement et test du backend PMT", saved.getDescription());
        assertNotNull(saved.getOwner());
        assertEquals(owner.getId(), saved.getOwner().getId());

        createdProjectId = saved.getId();
    }

    @Test
    @Order(2)
    void testGetProjectById() {
        assertNotNull(createdProjectId, "Le projet doit avoir été créé avant ce test");

        Project found = projectService.getProjectById(createdProjectId);
        assertNotNull(found, "Le projet doit être trouvé");
        assertEquals("PMT Backend", found.getName());
    }

    @Test
    @Order(3)
    void testGetAllProjects() {
        List<Project> projects = projectService.getAllProjects();
        assertFalse(projects.isEmpty(), "La liste des projets ne doit pas être vide");
    }

    @Test
    @Order(4)
    void testGetAllProjectsDto() {
        List<ProjectDTO> projectsDto = projectService.getAllProjectsDto();
        assertFalse(projectsDto.isEmpty(), "La liste des DTO de projets ne doit pas être vide");
        ProjectDTO dto = projectsDto.get(0);
        assertNotNull(dto.getId(), "L'ID du DTO ne doit pas être null");
        assertNotNull(dto.getName(), "Le nom du projet DTO ne doit pas être null");
    }

    @Test
    @Order(5)
    void testGetProjectDtoById() {
        assertNotNull(createdProjectId, "Le projet doit exister pour tester le DTO");
        ProjectDTO dto = projectService.getProjectDtoById(createdProjectId);
        assertNotNull(dto, "Le DTO doit être trouvé");
        assertEquals("PMT Backend", dto.getName());
    }

    @Test
    @Order(6)
    void testProjectNotFound() {
        UUID randomId = UUID.randomUUID();
        Optional<Project> projectOpt = projectRepository.findById(randomId);
        assertTrue(projectOpt.isEmpty(), "Aucun projet ne doit être trouvé pour cet UUID aléatoire");
    }
}
