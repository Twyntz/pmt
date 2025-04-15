package com.codesolutions.pmt_backend.Service;

import com.codesolutions.pmt_backend.Entity.Notification;
import com.codesolutions.pmt_backend.Repository.NotificationRepository;
import com.codesolutions.pmt_backend.Service.NotificationService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository repository;

    public NotificationServiceImpl(NotificationRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<Notification> getAll() {
        return repository.findAll();
    }

    @Override
    public Notification save(Notification notification) {
        return repository.save(notification);
    }

    @Override
    public List<Notification> getUnreadForUser(UUID userId) {
        return repository.findByUserIdAndIsReadFalse(userId);
    }

    @Override
    public Notification markAsRead(UUID id) {
        Optional<Notification> opt = repository.findById(id);
        Notification notif = opt.orElseThrow(() -> new RuntimeException("Notification introuvable"));
        notif.setRead(true);
        return repository.save(notif);
    }
}
