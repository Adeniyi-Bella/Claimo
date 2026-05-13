package com.claimo.api.company.membership;

import java.util.List;
import java.util.UUID;

import com.claimo.api.company.enums.CompanyRole;
import com.claimo.api.company.model.Company;
import com.claimo.api.user.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CompanyMemberServiceImpl implements CompanyMemberService {

    private final CompanyMemberRepository companyMemberRepository;

    @Override
    @Transactional
    public CompanyMember addMember(Company company, User user, CompanyRole role) {
        CompanyMember member = new CompanyMember();
        member.setCompany(company);
        member.setUser(user);
        member.setCompanyId(company.getId());
        member.setUserId(user.getId());
        member.setRole(role);
        return companyMemberRepository.save(member);
    }

    @Override
    public List<CompanyMember> findByUserId(UUID userId) {
        return companyMemberRepository.findAllByUser_Id(userId);
    }

    @Override
    public boolean isMemberOfCompany(UUID userId, UUID companyId) {
        return companyMemberRepository.existsByUser_IdAndCompany_Id(userId, companyId);
    }
}
