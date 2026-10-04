package com.campusconnect;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "suggestions")
class SuggestionEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) Long id;
    @Column(nullable = false, length = 180) String title;
    @Column(nullable = false, length = 1200) String content;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "author_id", nullable = false) UserEntity author;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) SuggestionStatus status = SuggestionStatus.UNDER_REVIEW;
    @Column(nullable = false, updatable = false) Instant createdAt = Instant.now();
    protected SuggestionEntity() {}
    SuggestionEntity(String title, String content, UserEntity author) { this.title = title; this.content = content; this.author = author; }
}
