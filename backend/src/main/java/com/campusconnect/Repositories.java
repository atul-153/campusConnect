package com.campusconnect;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

interface UserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByEmail(String email);
    long countByRole(Role role);
}
interface ElectionRepository extends JpaRepository<ElectionEntity, Long> {
    @Query("select distinct e from ElectionEntity e left join fetch e.candidates order by e.createdAt desc") List<ElectionEntity> findAllWithCandidates();
    boolean existsByCategoryAndStatus(ElectionCategory category, ElectionStatus status);
}
interface CandidateRepository extends JpaRepository<CandidateEntity, Long> { List<CandidateEntity> findByElectionId(Long electionId); }
interface VoteRepository extends JpaRepository<VoteEntity, Long> {
    boolean existsByElectionIdAndUserId(Long electionId, Long userId);
    boolean existsByElectionCategoryAndUserId(ElectionCategory category, Long userId);
    long countByElectionId(Long electionId);
    long countByUserId(Long userId);
    long countByCandidateId(Long candidateId);
}
interface SuggestionRepository extends JpaRepository<SuggestionEntity, Long> {
    @Query("select s from SuggestionEntity s join fetch s.author order by s.createdAt desc") List<SuggestionEntity> findAllWithAuthors();
    long countByAuthorId(Long authorId);
}
interface ReactionRepository extends JpaRepository<ReactionEntity, Long> {
    Optional<ReactionEntity> findBySuggestionIdAndUserId(Long suggestionId, Long userId);
    void deleteAllBySuggestionId(Long suggestionId);
    @Query("select coalesce(sum(case when r.liked = true then 1 else -1 end), 0) from ReactionEntity r where r.suggestion.id = :suggestionId")
    long score(@Param("suggestionId") Long suggestionId);
}
interface ComplaintRepository extends JpaRepository<ComplaintEntity, Long> {
    @Query("select c from ComplaintEntity c join fetch c.author order by c.createdAt desc") List<ComplaintEntity> findAllWithAuthors();
    long countByAuthorId(Long authorId);
}
interface EventRepository extends JpaRepository<EventEntity, Long> {
    List<EventEntity> findByStartsAtAfterOrderByStartsAtAsc(Instant now);
    List<EventEntity> findAllByOrderByStartsAtAsc();
    long countByStartsAtAfter(Instant now);
}
