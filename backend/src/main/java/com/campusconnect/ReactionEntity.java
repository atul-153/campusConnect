package com.campusconnect;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "suggestion_reactions", uniqueConstraints = @UniqueConstraint(name = "uk_reaction_suggestion_user", columnNames = {"suggestion_id", "user_id"}))
class ReactionEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "suggestion_id", nullable = false) SuggestionEntity suggestion;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false) UserEntity user;
    @Column(nullable = false) boolean liked;
    @Column(nullable = false) Instant updatedAt = Instant.now();
    protected ReactionEntity() {}
    ReactionEntity(SuggestionEntity suggestion, UserEntity user, boolean liked) { this.suggestion = suggestion; this.user = user; this.liked = liked; }
}
