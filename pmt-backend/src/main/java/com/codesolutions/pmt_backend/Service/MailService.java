package com.codesolutions.pmt_backend.Service;

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

    public String getFrontendUrl() {
        return frontendUrl;
    }

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
}
