package com.campusconnect;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "elections")
class ElectionEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) Long id;
    @Column(nullable = false, length = 180) String title;
    @Column(nullable = false, length = 1200) String description;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 40) ElectionCategory category;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 16) ElectionStatus status = ElectionStatus.DRAFT;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "created_by", nullable = false) UserEntity createdBy;
    @Column(nullable = false, updatable = false) Instant createdAt = Instant.now();
    @OneToMany(mappedBy = "election", cascade = CascadeType.ALL, orphanRemoval = true) List<CandidateEntity> candidates = new ArrayList<>();
    protected ElectionEntity() {}
    ElectionEntity(String title, String description, ElectionCategory category, UserEntity createdBy) { this.title = title; this.description = description; this.category = category; this.createdBy = createdBy; }
}
