package com.campusconnect;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
class BootstrapAdmin {
    @Bean
    ApplicationRunner createInitialAdmin(UserRepository users, PasswordEncoder passwords,
        @Value("${ADMIN_EMAIL:}") String email,
        @Value("${ADMIN_PASSWORD:}") String password,
        @Value("${ADMIN_NAME:CampusConnect Admin}") String name) {
        return args -> {
            if (!email.isBlank() && !password.isBlank()) {
                String normalizedEmail = email.trim().toLowerCase();
                if (users.findByEmail(normalizedEmail).isEmpty()) {
                    users.save(new UserEntity(name, normalizedEmail, passwords.encode(password), Role.ADMIN));
                }
            }
        };
    }
}
