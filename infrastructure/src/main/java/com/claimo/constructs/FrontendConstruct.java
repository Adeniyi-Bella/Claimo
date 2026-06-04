package com.claimo.constructs;

import software.constructs.Construct;
import software.amazon.awscdk.RemovalPolicy;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketEncryption;
import software.amazon.awscdk.services.s3.BlockPublicAccess;
import software.amazon.awscdk.services.cloudfront.*;
import software.amazon.awscdk.services.cloudfront.origins.S3BucketOrigin;
import software.amazon.awscdk.services.route53.*;
import software.amazon.awscdk.services.route53.targets.CloudFrontTarget;
import software.amazon.awscdk.services.certificatemanager.ICertificate;
import software.amazon.awscdk.services.certificatemanager.Certificate;

import java.util.List;

public class FrontendConstruct extends Construct {

    public FrontendConstruct(final Construct scope, final String id) {
        super(scope, id);

        String domainName = System.getProperty("DOMAIN_NAME");
        String certArn = System.getProperty("ACM_CERTIFICATE_ARN");

        // S3 bucket
        Bucket frontendBucket = Bucket.Builder.create(this, "FrontendBucket")
                .bucketName("claimo-react-frontend")
                .versioned(true)
                .encryption(BucketEncryption.S3_MANAGED)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .removalPolicy(RemovalPolicy.RETAIN)
                .build();

        // ACM certificate (created manually in us-east-1)
        ICertificate certificate = Certificate.fromCertificateArn(this, "Certificate", certArn);

        // CloudFront distribution
        Distribution distribution = Distribution.Builder.create(this, "FrontendDistribution")
                .defaultBehavior(BehaviorOptions.builder()
                        .origin(S3BucketOrigin.withOriginAccessControl(frontendBucket))
                        .viewerProtocolPolicy(ViewerProtocolPolicy.REDIRECT_TO_HTTPS)
                        .build())
                .domainNames(List.of(domainName, "www." + domainName))
                .certificate(certificate)
                .defaultRootObject("index.html")
                .errorResponses(List.of(
                        ErrorResponse.builder()
                                .httpStatus(403)
                                .responseHttpStatus(200)
                                .responsePagePath("/index.html")
                                .build(),
                        ErrorResponse.builder()
                                .httpStatus(404)
                                .responseHttpStatus(200)
                                .responsePagePath("/index.html")
                                .build()
                ))
                .build();

        // Route53 hosted zone
        IHostedZone hostedZone = HostedZone.fromLookup(this, "HostedZone",
                HostedZoneProviderProps.builder()
                        .domainName(domainName)
                        .build());

        // A record for root domain
        ARecord.Builder.create(this, "RootARecord")
                .zone(hostedZone)
                .target(RecordTarget.fromAlias(new CloudFrontTarget(distribution)))
                .build();

        // A record for www
        ARecord.Builder.create(this, "WwwARecord")
                .zone(hostedZone)
                .recordName("www")
                .target(RecordTarget.fromAlias(new CloudFrontTarget(distribution)))
                .build();
    }
}