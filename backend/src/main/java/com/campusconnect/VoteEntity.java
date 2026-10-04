package com.campusconnect;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "votes", uniqueConstraints = {
    @UniqueConstraint(name = "uk_vote_election_user", columnNames = {"election_id", "user_id"}),
    @UniqueConstraint(name = "uk_vote_category_user", columnNames = {"election_category", "user_id"})
})
class VoteEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "election_id", nullable = false) ElectionEntity election;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "candidate_id", nullable = false) CandidateEntity candidate;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false) UserEntity user;
    @Enumerated(EnumType.STRING) @Column(name = "election_category", nullable = false, length = 40) ElectionCategory electionCategory;
    @Column(nullable = false, updatable = false) Instant createdAt = Instant.now();
    protected VoteEntity() {}
    VoteEntity(ElectionEntity election, CandidateEntity candidate, UserEntity user) { this.election = election; this.candidate = candidate; this.user = user; this.electionCategory = election.category; }
}
