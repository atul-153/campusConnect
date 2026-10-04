package com.campusconnect;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.List;

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

    @Bean
    ApplicationRunner createRequestedStudents(UserRepository users, PasswordEncoder passwords,
        @Value("${SEED_STUDENT_PASSWORD:}") String password) {
        return args -> {
            if (password.isBlank()) return;
            List<SeedStudent> students = List.of(
                new SeedStudent("Atul Tiwari", "atul.tiwari_it_2025@tsdcem.ac.in"),
                new SeedStudent("Anurag Yadav", "anurag.yadav_it_2025@tsdcem.ac.in"),
                new SeedStudent("Hrishabh Soni", "hrishabh.soni_it_2025@tsdcem.ac.in")
            );
            for (SeedStudent student : students) {
                if (users.findByEmail(student.email()).isEmpty()) {
                    users.save(new UserEntity(student.name(), student.email(), passwords.encode(password), Role.STUDENT));
                }
            }
        };
    }

    private record SeedStudent(String name, String email) {}
}
