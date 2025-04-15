package com.codesolutions.pmt_backend.Service;

import com.codesolutions.pmt_backend.Entity.User;

import java.util.List;
import java.util.UUID;

public interface UserService {
    List<User> getAllUsers();
    User createUser(User user);
    User getUserById(UUID id);
}
