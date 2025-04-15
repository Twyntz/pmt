package com.codesolutions.pmt_backend.Controller;

import com.codesolutions.pmt_backend.Entity.ProjectMember;
import com.codesolutions.pmt_backend.Service.ProjectMemberService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/project-members")
public class ProjectMemberController {

    private final ProjectMemberService service;

    public ProjectMemberController(ProjectMemberService service) {
        this.service = service;
    }

    @GetMapping
    public List<ProjectMember> getAll() {
        return service.getAll();
    }

    @PostMapping
    public ProjectMember addMember(@RequestBody ProjectMember member) {
        return service.addMember(member);
    }

    @GetMapping("/{id}")
    public ProjectMember getById(@PathVariable UUID id) {
        return service.getById(id);
    }
}
