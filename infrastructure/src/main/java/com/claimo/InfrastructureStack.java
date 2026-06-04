package com.claimo;

import com.claimo.constructs.CicdConstruct;
import com.claimo.constructs.FrontendConstruct;
import software.constructs.Construct;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;

public class InfrastructureStack extends Stack {

    public InfrastructureStack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);

        new FrontendConstruct(this, "Frontend");
        new CicdConstruct(this, "Cicd");
    }
}