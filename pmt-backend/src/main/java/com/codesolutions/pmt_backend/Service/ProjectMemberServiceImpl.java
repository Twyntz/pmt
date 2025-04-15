package com.codesolutions.pmt_backend.Service;

import com.codesolutions.pmt_backend.Entity.ProjectMember;
import com.codesolutions.pmt_backend.Repository.ProjectMemberRepository;
import com.codesolutions.pmt_backend.Service.ProjectMemberService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ProjectMemberServiceImpl implements ProjectMemberService {

    private final ProjectMemberRepository repository;

    public ProjectMemberServiceImpl(ProjectMemberRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<ProjectMember> getAll() {
        return repository.findAll();
    }

    @Override
    public ProjectMember addMember(ProjectMember member) {
        return repository.save(member);
    }

    @Override
    public ProjectMember getById(UUID id) {
        Optional<ProjectMember> optional = repository.findById(id);
        return optional.orElseThrow(() -> new RuntimeException("Membre non trouvé"));
    }
}
