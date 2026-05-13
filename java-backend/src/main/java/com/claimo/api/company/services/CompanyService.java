package com.claimo.api.company.services;

import com.claimo.api.company.model.Company;
import com.claimo.api.user.model.User;

public interface CompanyService {
    Company createCompany(String name, User owner);
}
