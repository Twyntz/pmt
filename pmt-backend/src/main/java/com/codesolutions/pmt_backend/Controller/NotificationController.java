package com.codesolutions.pmt_backend.Controller;

import com.codesolutions.pmt_backend.Entity.Notification;
import com.codesolutions.pmt_backend.Service.NotificationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @GetMapping
    public List<Notification> getAll() {
        return service.getAll();
    }

    @GetMapping("/unread/{userId}")
    public List<Notification> getUnread(@PathVariable UUID userId) {
        return service.getUnreadForUser(userId);
    }

    @PostMapping
    public Notification create(@RequestBody Notification notification) {
        return service.save(notification);
    }

    @PutMapping("/{id}/read")
    public Notification markAsRead(@PathVariable UUID id) {
        return service.markAsRead(id);
    }
}
