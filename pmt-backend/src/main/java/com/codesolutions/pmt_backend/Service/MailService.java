package com.codesolutions.pmt_backend.Service;

import com.codesolutions.pmt_backend.Entity.Task;
import com.codesolutions.pmt_backend.Entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.Nullable;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class MailService {
    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final JavaMailSender mailSender; // peut être null si starter/bean absent

    @Value("${app.notifications.enabled:true}")
    private boolean notificationsEnabled;

    @Value("${spring.mail.from:no-reply@localhost}")
    private String defaultFrom;

    @Value("${app.frontend-url:http://localhost:4200}")
    private String frontendUrl;

    public MailService(ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSender = mailSenderProvider.getIfAvailable();
        if (this.mailSender == null) {
            log.warn("JavaMailSender introuvable ou non configuré. Les e-mails seront ignorés jusqu'à correction.");
        }
    }

    /** Exposé pour les contrôleurs/tests. */
    public String getFrontendUrl() { return frontendUrl; }

    /** Envoi générique d'un texte. */
    public void sendText(String to, String subject, String body, @Nullable String from) {
        if (!notificationsEnabled) {
            log.info("[MAIL DISABLED] to={} subject={}", to, subject);
            return;
        }
        if (mailSender == null) {
            log.error("[MAIL ERROR] JavaMailSender indisponible: vérifie spring-boot-starter-mail et la conf SMTP.");
            return;
        }
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom((from != null && !from.isBlank()) ? from : defaultFrom);
            msg.setTo(to);
            msg.setSubject(subject);
            msg.setText(body);
            mailSender.send(msg);
            log.info("[MAIL SENT] to={} subject={}", to, subject);
        } catch (Exception e) {
            log.error("Échec envoi mail to={} : {}", to, e.getMessage(), e);
        }
    }

    // -------------------------------------------------------------------------
    // Convenience methods attendues par les tests/contrôleurs
    // -------------------------------------------------------------------------

    /** Alias compatible avec certains tests : délègue à sendTaskAssignedMail(...) */
    public void sendTaskAssigned(User to, Task task, String changerDisplay) {
        sendTaskAssignedMail(to, task, changerDisplay);
    }

    /** Méthode simple appelée par les contrôleurs/tests. */
    public void sendTaskAssignedMail(User to, Task task, String changerDisplay) {
        if (to == null || to.getEmail() == null || to.getEmail().isBlank() || task == null) return;

        String subject = "[PMT] Nouvelle tâche assignée: " + task.getTitle();
        String link = String.format("%s/projects/%s/tasks/%s",
                getFrontendUrl(),
                task.getProject() != null ? task.getProject().getId() : null,
                task.getId()
        );

        String body = new StringBuilder()
                .append("Bonjour,\n\n")
                .append("Une tâche vient de vous être assignée.\n\n")
                .append("Titre      : ").append(task.getTitle()).append("\n")
                .append("Projet     : ").append(task.getProject() != null ? task.getProject().getName() : "-").append("\n")
                .append("Statut     : ").append(task.getStatus() != null ? task.getStatus().name() : "-").append("\n")
                .append("Priorité   : ").append(task.getPriority() != null ? task.getPriority().name() : "-").append("\n")
                .append(task.getDeadline() != null ? "Échéance   : " + task.getDeadline() + "\n" : "")
                .append(task.getEndDate() != null ? "Fin        : " + task.getEndDate() + "\n" : "")
                .append("Assignée par : ").append(changerDisplay != null && !changerDisplay.isBlank() ? changerDisplay : "Système").append("\n")
                .append("\nDétails : ").append(link)
                .append("\n\n--\nPMT")
                .toString();

        sendText(to.getEmail(), subject, body, null);
    }
}
