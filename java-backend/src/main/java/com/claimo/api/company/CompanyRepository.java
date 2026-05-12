package com.claimo.api.company;

import org.springframework.data.jpa.repository.JpaRepository;

import com.claimo.api.company.model.Company;

import java.util.UUID;

public interface CompanyRepository extends JpaRepository<Company, UUID> {
}
