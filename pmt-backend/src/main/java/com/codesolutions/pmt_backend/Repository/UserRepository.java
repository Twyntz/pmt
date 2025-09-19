package com.codesolutions.pmt_backend.Repository;

import java.util.Optional;

import com.codesolutions.pmt_backend.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);

    Optional<User> findByEmail(String email);
}