package com.claimo.api.company.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.claimo.api.company.model.Company;

import java.util.Optional;
import java.util.UUID;

public interface CompanyRepository extends JpaRepository<Company, UUID> {
    Optional<Company> findByOwner_Id(UUID ownerId);
}
