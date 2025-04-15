package com.codesolutions.pmt_backend.Service;

import com.codesolutions.pmt_backend.Entity.User;
import com.codesolutions.pmt_backend.Repository.UserRepository;
import com.codesolutions.pmt_backend.Service.UserService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public User createUser(User user) {
        // Ici, tu pourrais ajouter des règles (ex : check email déjà utilisé)
        return userRepository.save(user);
    }

    @Override
    public User getUserById(UUID id) {
        Optional<User> optionalUser = userRepository.findById(id);
        return optionalUser.orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }
}
