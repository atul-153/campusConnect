package com.campusconnect;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "users", uniqueConstraints = @UniqueConstraint(name = "uk_user_email", columnNames = "email"))
class UserEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) Long id;
    @Column(nullable = false, length = 120) String name;
    @Column(nullable = false, length = 190) String email;
    @Column(nullable = false) String passwordHash;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 16) Role role = Role.STUDENT;
    @Column(nullable = false, updatable = false) Instant createdAt = Instant.now();
    protected UserEntity() {}
    UserEntity(String name, String email, String passwordHash, Role role) { this.name = name; this.email = email; this.passwordHash = passwordHash; this.role = role; }
}
