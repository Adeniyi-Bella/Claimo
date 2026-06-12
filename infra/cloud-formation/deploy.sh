#!/bin/bash

# Step 1 — bootstrap bucket, must exist before package runs
aws cloudformation deploy \
  --template-file s3/s3-template.yaml \
  --stack-name claimo-cfn-bucket \
  --parameter-overrides AppName=claimo BucketPurpose=cfn-templates BlockPublicAccess=true

# Step 2 — package
aws cloudformation package \
  --template-file claimo.yaml \
  --s3-bucket claimo-cfn-templates \
  --output-template-file claimo-packaged.yaml

# Step 3 — deploy
aws cloudformation deploy \
  --template-file claimo-packaged.yaml \
  --stack-name claimo \
  --capabilities CAPABILITY_NAMED_IAM