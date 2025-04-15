package com.codesolutions.pmt_backend.Service;

import com.codesolutions.pmt_backend.Entity.Notification;

import java.util.List;
import java.util.UUID;

public interface NotificationService {
    List<Notification> getAll();
    Notification save(Notification notification);
    List<Notification> getUnreadForUser(UUID userId);
    Notification markAsRead(UUID id);
}
