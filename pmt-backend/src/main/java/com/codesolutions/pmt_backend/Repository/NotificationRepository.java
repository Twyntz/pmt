package com.codesolutions.pmt_backend.Repository;

import com.codesolutions.pmt_backend.Entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByUserIdAndIsReadFalse(UUID userId);
}
