package com.campusconnect;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
class ElectionController {
    private final ElectionRepository elections;
    private final CandidateRepository candidates;
    private final VoteRepository votes;
    private final UserRepository users;

    ElectionController(ElectionRepository elections, CandidateRepository candidates, VoteRepository votes, UserRepository users) {
        this.elections = elections;
        this.candidates = candidates;
        this.votes = votes;
        this.users = users;
    }

    @GetMapping("/elections")
    @Transactional(readOnly = true)
    List<Dtos.ElectionView> list(@AuthenticationPrincipal String email) {
        UserEntity user = user(email);
        return elections.findAllWithCandidates().stream().map(election -> view(election, user.role == Role.ADMIN)).toList();
    }

    @PostMapping("/elections/{electionId}/vote")
    @PreAuthorize("hasRole('STUDENT')")
    @Transactional
    @ResponseStatus(HttpStatus.CREATED)
    void vote(@PathVariable Long electionId, @Valid @RequestBody Dtos.VoteRequest request,
              @AuthenticationPrincipal String email) {
        ElectionEntity election = election(electionId);
        if (election.status != ElectionStatus.OPEN) throw ApiException.badRequest("This election is not open for voting");
        if (votes.existsByElectionCategoryAndUserId(election.category, user(email).id))
            throw ApiException.conflict("You have already voted in this election category");
        CandidateEntity candidate = candidates.findById(request.candidateId()).orElseThrow(() -> ApiException.notFound("Candidate not found"));
        if (!candidate.election.id.equals(election.id)) throw ApiException.badRequest("That candidate is not part of this election");
        votes.save(new VoteEntity(election, candidate, user(email)));
    }

    @PostMapping("/admin/elections")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    Dtos.ElectionView create(@Valid @RequestBody Dtos.ElectionRequest request,
        @AuthenticationPrincipal String email) {
        ElectionEntity election = elections.save(new ElectionEntity(request.title().trim(), request.description().trim(), request.category(), user(email)));
        return view(election, true);
    }

    @PutMapping("/admin/elections/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    Dtos.ElectionView update(@PathVariable Long id, @Valid @RequestBody Dtos.ElectionRequest request) {
        ElectionEntity election = election(id);
        if (election.status == ElectionStatus.PUBLISHED) throw ApiException.badRequest("Published elections cannot be edited");
        if (election.category != request.category() && votes.countByElectionId(id) > 0)
            throw ApiException.badRequest("An election category cannot change after voting begins");
        election.title = request.title().trim();
        election.description = request.description().trim();
        election.category = request.category();
        return view(election, true);
    }

    @DeleteMapping("/admin/elections/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@PathVariable Long id) {
        if (votes.countByElectionId(id) > 0) throw ApiException.conflict("An election with recorded votes cannot be removed");
        elections.delete(election(id));
    }

    @PatchMapping("/admin/elections/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    Dtos.ElectionView setStatus(@PathVariable Long id, @Valid @RequestBody Dtos.ElectionStatusRequest request) {
        ElectionEntity election = election(id);
        ElectionStatus next = request.status();
        boolean validTransition = (election.status == ElectionStatus.DRAFT && next == ElectionStatus.OPEN)
            || (election.status == ElectionStatus.CLOSED && next == ElectionStatus.OPEN)
            || (election.status == ElectionStatus.OPEN && next == ElectionStatus.CLOSED)
            || (election.status == ElectionStatus.CLOSED && next == ElectionStatus.PUBLISHED);
        if (!validTransition) throw ApiException.badRequest("Election status cannot move from " + election.status + " to " + next);
        if (next == ElectionStatus.OPEN) {
            if (candidates.findByElectionId(id).size() < 2) throw ApiException.badRequest("Add at least two candidates before opening voting");
            boolean anotherOpen = elections.findAll().stream().anyMatch(other -> !other.id.equals(id)
                && other.category == election.category && other.status == ElectionStatus.OPEN);
            if (anotherOpen) throw ApiException.conflict("Another election in this category is already open");
        }
        election.status = next;
        return view(election, true);
    }

    @PostMapping("/admin/elections/{id}/candidates")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    Dtos.CandidateView addCandidate(@PathVariable Long id, @Valid @RequestBody Dtos.CandidateRequest request) {
        ElectionEntity election = election(id);
        if (election.status == ElectionStatus.PUBLISHED || election.status == ElectionStatus.OPEN
            || votes.countByElectionId(id) > 0)
            throw ApiException.badRequest("Candidates cannot be changed after voting begins");
        CandidateEntity candidate = candidates.save(new CandidateEntity(election, request.name().trim(), clean(request.platform())));
        return new Dtos.CandidateView(candidate.id, candidate.name, candidate.platform, 0L);
    }

    @PutMapping("/admin/candidates/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    Dtos.CandidateView updateCandidate(@PathVariable Long id, @Valid @RequestBody Dtos.CandidateRequest request) {
        CandidateEntity candidate = candidates.findById(id).orElseThrow(() -> ApiException.notFound("Candidate not found"));
        if (candidate.election.status == ElectionStatus.OPEN || candidate.election.status == ElectionStatus.PUBLISHED
            || votes.countByElectionId(candidate.election.id) > 0)
            throw ApiException.badRequest("Candidates cannot be changed after voting begins");
        candidate.name = request.name().trim();
        candidate.platform = clean(request.platform());
        return new Dtos.CandidateView(candidate.id, candidate.name, candidate.platform, votes.countByCandidateId(id));
    }

    @DeleteMapping("/admin/candidates/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteCandidate(@PathVariable Long id) {
        CandidateEntity candidate = candidates.findById(id).orElseThrow(() -> ApiException.notFound("Candidate not found"));
        if (candidate.election.status == ElectionStatus.OPEN || candidate.election.status == ElectionStatus.PUBLISHED)
            throw ApiException.badRequest("Candidates cannot be removed while voting is open or results are published");
        if (votes.countByCandidateId(id) > 0) throw ApiException.conflict("A candidate with recorded votes cannot be removed");
        candidates.delete(candidate);
    }

    private Dtos.ElectionView view(ElectionEntity election, boolean admin) {
        boolean showResults = admin || election.status == ElectionStatus.PUBLISHED;
        List<Dtos.CandidateView> candidateViews = candidates.findByElectionId(election.id).stream()
            .map(candidate -> new Dtos.CandidateView(candidate.id, candidate.name, candidate.platform,
                showResults ? votes.countByCandidateId(candidate.id) : null)).toList();
        return new Dtos.ElectionView(election.id, election.title, election.description, election.category,
            election.status, admin || election.status == ElectionStatus.PUBLISHED ? votes.countByElectionId(election.id) : 0,
            candidateViews);
    }

    private ElectionEntity election(Long id) { return elections.findById(id).orElseThrow(() -> ApiException.notFound("Election not found")); }
    private UserEntity user(String email) { return users.findByEmail(email).orElseThrow(() -> ApiException.notFound("User not found")); }
    private String clean(String value) { return value == null ? "" : value.trim(); }
}
