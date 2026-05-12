package com.claimo.api.company.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.claimo.api.company.CompanyRepository;
import com.claimo.api.company.dto.CompanyDto;
import com.claimo.api.company.model.Company;

@Service
@RequiredArgsConstructor
public class CompanyServiceImpl implements CompanyService {

    private final CompanyRepository companyRepository;

    @Override
    @Transactional
    public CompanyDto createCompany(String name) {
        Company company = new Company();
        company.setName(name);
        return CompanyDto.fromEntity(companyRepository.save(company));
    }
}
