package com.campusconnect;

import jakarta.persistence.*;

@Entity
@Table(name = "candidates")
class CandidateEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "election_id", nullable = false) ElectionEntity election;
    @Column(nullable = false, length = 120) String name;
    @Column(length = 1000) String platform;
    protected CandidateEntity() {}
    CandidateEntity(ElectionEntity election, String name, String platform) { this.election = election; this.name = name; this.platform = platform; }
}
