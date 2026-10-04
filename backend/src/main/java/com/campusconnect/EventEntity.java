package com.campusconnect;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "campus_events")
class EventEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) Long id;
    @Column(nullable = false, length = 180) String title;
    @Column(nullable = false, length = 1200) String description;
    @Column(nullable = false, length = 180) String location;
    @Column(nullable = false, length = 80) String category;
    @Column(nullable = false) Instant startsAt;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "created_by", nullable = false) UserEntity createdBy;
    protected EventEntity() {}
    EventEntity(String title, String description, String location, String category, Instant startsAt, UserEntity createdBy) { this.title = title; this.description = description; this.location = location; this.category = category; this.startsAt = startsAt; this.createdBy = createdBy; }
}
