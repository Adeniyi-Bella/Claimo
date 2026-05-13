package com.claimo.api.company.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.claimo.api.company.CompanyRepository;
import com.claimo.api.company.model.Company;
import com.claimo.api.user.model.User;

@Service
@RequiredArgsConstructor
public class CompanyServiceImpl implements CompanyService {

    private final CompanyRepository companyRepository;

    @Override
    @Transactional
    public Company createCompany(String name, User owner) {
        Company company = new Company();
        company.setName(name);
        company.setOwner(owner);
        return companyRepository.save(company);
    }
}
