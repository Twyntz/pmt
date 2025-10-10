package com.codesolutions.pmt_backend.Service;

import com.codesolutions.pmt_backend.Entity.Project;
import com.codesolutions.pmt_backend.Entity.Task;
import com.codesolutions.pmt_backend.Entity.TaskPriorityEnum;
import com.codesolutions.pmt_backend.Entity.TaskStatusEnum;
import com.codesolutions.pmt_backend.Entity.User;
import org.junit.jupiter.api.*;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@SpringBootTest
@Transactional
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class MailServiceIT {

    @TestConfiguration
    static class MailTestConfig {
        @Bean
        public JavaMailSender javaMailSender() {
            // Mock utilisé par le constructeur MailService(ObjectProvider<JavaMailSender>)
            return mock(JavaMailSender.class);
        }
    }

    @Autowired
    private MailService mailService;

    @Autowired
    private JavaMailSender mailSender; // mock injecté

    @BeforeEach
    void resetMocks() {
        reset(mailSender);
        // Valeurs par défaut stables pour chaque test
        ReflectionTestUtils.setField(mailService, "defaultFrom", "no-reply@localhost");
        ReflectionTestUtils.setField(mailService, "frontendUrl", "http://localhost:4200");
    }

    @Test
    @Order(1)
    void testSendText_WhenNotificationsDisabled_NoSendAndNoThrow() {
        // notifications désactivées
        ReflectionTestUtils.setField(mailService, "notificationsEnabled", false);

        // Appel
        assertDoesNotThrow(() ->
                mailService.sendText("alice@example.com", "Sujet", "Corps", null)
        );

        // Aucun envoi dû se produire
        verifyNoInteractions(mailSender);
    }

    @Test
    @Order(2)
    void testSendText_WhenNotificationsEnabled_SendsEmail() {
        ReflectionTestUtils.setField(mailService, "notificationsEnabled", true);

        mailService.sendText("bob@example.com", "Hello", "Bonjour Bob", null);

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender, times(1)).send(captor.capture());

        SimpleMailMessage sent = captor.getValue();
        assertArrayEquals(new String[]{"bob@example.com"}, sent.getTo());
        assertEquals("Hello", sent.getSubject());
        assertEquals("Bonjour Bob", sent.getText());
        assertEquals("no-reply@localhost", sent.getFrom());
    }

    @Test
    @Order(3)
    void testSendTaskAssignedMail_SendsWithComposedBodyAndLink() {
        ReflectionTestUtils.setField(mailService, "notificationsEnabled", true);

        // Prépare User
        User to = new User();
        to.setEmail("dev@example.com");
        to.setUsername("dev");

        // Prépare Project
        Project project = new Project();
        project.setId(UUID.randomUUID());
        project.setName("PMT");

        // Prépare Task
        Task task = new Task();
        task.setTitle("Implémenter notifications");
        task.setStatus(TaskStatusEnum.TODO);
        task.setPriority(TaskPriorityEnum.HIGH);
        task.setDeadline(LocalDate.now().plusDays(7));
        task.setProject(project);

        // Appel
        mailService.sendTaskAssignedMail(to, task, "Alice");

        // Vérification envoi
        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender, times(1)).send(captor.capture());
        SimpleMailMessage msg = captor.getValue();

        assertArrayEquals(new String[]{"dev@example.com"}, msg.getTo());
        assertTrue(msg.getSubject().contains("Nouvelle tâche assignée"), "Le sujet doit mentionner l'assignation");
        String body = msg.getText();
        assertNotNull(body);
        assertTrue(body.contains("Implémenter notifications"));
        assertTrue(body.contains("PMT"));
        assertTrue(body.contains("TODO"));
        assertTrue(body.contains("HIGH"));
        // Le lien doit contenir /projects/{id}/tasks/ (l'id tâche peut être null si non persistée, mais le format reste présent)
        assertTrue(body.contains("/projects/" + project.getId()), "Le corps doit contenir l'ID de projet dans l'URL");
    }

    @Test
    @Order(4)
    void testSendTaskAssigned_AliasDelegatesToSendTaskAssignedMail() {
        ReflectionTestUtils.setField(mailService, "notificationsEnabled", true);

        User to = new User();
        to.setEmail("qa@example.com");

        Task task = new Task();
        task.setTitle("Écrire les tests");

        // Alias
        mailService.sendTaskAssigned(to, task, "CI-BOT");

        verify(mailSender, times(1)).send(any(SimpleMailMessage.class));
    }

    @Test
    @Order(5)
    void testSendTaskAssignedMail_NoOp_WhenMissingEmailOrTask() {
        ReflectionTestUtils.setField(mailService, "notificationsEnabled", true);

        User noEmail = new User();
        noEmail.setEmail("   "); // blanc => invalide

        // Cas 1 : email invalide -> no-op
        mailService.sendTaskAssignedMail(noEmail, new Task(), "System");
        verifyNoInteractions(mailSender);

        reset(mailSender);

        // Cas 2 : task null -> no-op
        User ok = new User();
        ok.setEmail("user@example.com");
        mailService.sendTaskAssignedMail(ok, null, "System");
        verifyNoInteractions(mailSender);
    }

    @Test
    @Order(6)
    void testGetFrontendUrl_ReturnsConfiguredValue() {
        // Par défaut défini au @BeforeEach
        assertEquals("http://localhost:4200", mailService.getFrontendUrl());
    }
}
