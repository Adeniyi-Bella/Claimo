package com.claimo.constructs;

import software.constructs.Construct;
import software.amazon.awscdk.services.codebuild.*;
import software.amazon.awscdk.services.codepipeline.*;
import software.amazon.awscdk.services.codepipeline.actions.*;
import software.amazon.awscdk.services.codecommit.IRepository;
import software.amazon.awscdk.services.codecommit.Repository;
import software.amazon.awscdk.services.iam.*;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.IBucket;

import java.util.List;

public class CicdConstruct extends Construct {

    public CicdConstruct(final Construct scope, final String id) {
        super(scope, id);

        // Reference existing CodeCommit repo
        IRepository codeRepo = Repository.fromRepositoryName(this, "ClaimoRepo", "claimo");

        // Reference existing S3 hosting bucket
        IBucket frontendBucket = Bucket.fromBucketName(this, "FrontendBucket", "claimo-react-frontend");

        // CodeBuild IAM role
        Role buildRole = Role.Builder.create(this, "FrontendBuildRole")
                .roleName("claimo-codebuild-frontend-role")
                .assumedBy(new ServicePrincipal("codebuild.amazonaws.com"))
                .managedPolicies(List.of(
                        ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMReadOnlyAccess")
                ))
                .build();

        // Inline policy for S3 and CloudFront
        buildRole.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(List.of(
                        "s3:PutObject",
                        "s3:DeleteObject",
                        "s3:ListBucket",
                        "s3:GetObject"
                ))
                .resources(List.of(
                        frontendBucket.getBucketArn(),
                        frontendBucket.getBucketArn() + "/*"
                ))
                .build());

        buildRole.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(List.of("cloudfront:CreateInvalidation"))
                .resources(List.of("*"))
                .build());

        // CodeBuild project
        PipelineProject buildProject = PipelineProject.Builder.create(this, "FrontendBuildProject")
                .projectName("claimo-frontend-build")
                .role(buildRole)
                .environment(BuildEnvironment.builder()
                        .buildImage(LinuxBuildImage.AMAZON_LINUX_2_5)
                        .computeType(ComputeType.SMALL)
                        .build())
                .buildSpec(BuildSpec.fromSourceFilename("react-frontend/buildspec.yml"))
                .build();

        // Pipeline artifacts
        Artifact sourceArtifact = new Artifact("SourceArtifact");
        Artifact buildArtifact = new Artifact("BuildArtifact");

        // CodePipeline
        Pipeline.Builder.create(this, "FrontendPipeline")
                .pipelineName("claimo-frontend-pipeline")
                .stages(List.of(
                        StageProps.builder()
                                .stageName("Source")
                                .actions(List.of(
                                        CodeCommitSourceAction.Builder.create()
                                                .actionName("Source")
                                                .repository(codeRepo)
                                                .branch("main")
                                                .output(sourceArtifact)
                                                .build()
                                ))
                                .build(),
                        StageProps.builder()
                                .stageName("Build")
                                .actions(List.of(
                                        CodeBuildAction.Builder.create()
                                                .actionName("Build")
                                                .project(buildProject)
                                                .input(sourceArtifact)
                                                .outputs(List.of(buildArtifact))
                                                .build()
                                ))
                                .build()
                ))
                .build();
    }
}