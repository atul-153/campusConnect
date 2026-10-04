package com.campusconnect;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "complaints")
class ComplaintEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "author_id", nullable = false) UserEntity author;
    @Column(nullable = false, length = 180) String subject;
    @Column(nullable = false, length = 3000) String description;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) ComplaintStatus status = ComplaintStatus.UNDER_REVIEW;
    @Column(nullable = false, updatable = false) Instant createdAt = Instant.now();
    protected ComplaintEntity() {}
    ComplaintEntity(UserEntity author, String subject, String description) { this.author = author; this.subject = subject; this.description = description; }
}
