package com.codesolutions.pmt_backend.Controller;

import com.codesolutions.pmt_backend.Entity.User;
import com.codesolutions.pmt_backend.Repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:4200", "http://127.0.0.1:*"}, allowCredentials = "false")
public class AuthController {

    private final UserRepository users;

    public AuthController(UserRepository users) {
        this.users = users;
    }

    // DTO d'entrée minimal (username/email/password)
    public static class RegisterRequest {
        public String username;
        public String email;
        public String password;
    }

    // DTO de sortie (évite de renvoyer le password)
    public static class UserDTO {
        public String id;
        public String username;
        public String email;
        public LocalDateTime createdAt;

        public UserDTO(User u) {
            this.id = u.getId() != null ? u.getId().toString() : null;
            this.username = u.getUsername();
            this.email = u.getEmail();
            this.createdAt = u.getCreatedAt();
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        if (req == null || isBlank(req.username) || isBlank(req.email) || isBlank(req.password)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Missing fields"));
        }

        // Unicité email basique
        Optional<User> existing = users.findByEmail(req.email);
        if (existing.isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Email already exists"));
        }

        // Création user
        User u = new User();
        u.setUsername(req.username.trim());
        u.setEmail(req.email.trim());
        u.setPassword(req.password); // (à hasher plus tard si tu ajoutes la sécu)
        if (u.getCreatedAt() == null) {
            u.setCreatedAt(LocalDateTime.now());
        }
        User saved = users.save(u);

        return ResponseEntity
                .created(URI.create("/users/" + saved.getId()))
                .body(new UserDTO(saved));
    }

    private static boolean isBlank(String s) { return s == null || s.trim().isEmpty(); }
}
