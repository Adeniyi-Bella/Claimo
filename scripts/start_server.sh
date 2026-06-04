#!/bin/bash

# Fetch environment variables from Parameter Store
export DATABASE_HOST=$(aws ssm get-parameter --name /claimo/backend/DATABASE_HOST --with-decryption --query Parameter.Value --output text --region eu-central-1)
export DATABASE_PORT=$(aws ssm get-parameter --name /claimo/backend/DATABASE_PORT --with-decryption --query Parameter.Value --output text --region eu-central-1)
export DATABASE_NAME=$(aws ssm get-parameter --name /claimo/backend/DATABASE_NAME --with-decryption --query Parameter.Value --output text --region eu-central-1)
export DATABASE_USER=$(aws ssm get-parameter --name /claimo/backend/DATABASE_USER --with-decryption --query Parameter.Value --output text --region eu-central-1)
export DATABASE_PASSWORD=$(aws ssm get-parameter --name /claimo/backend/DATABASE_PASSWORD --with-decryption --query Parameter.Value --output text --region eu-central-1)
export CLERK_SECRET_KEY=$(aws ssm get-parameter --name /claimo/backend/CLERK_SECRET_KEY --with-decryption --query Parameter.Value --output text --region eu-central-1)
export CLERK_ISSUER_URI=$(aws ssm get-parameter --name /claimo/backend/CLERK_ISSUER_URI --with-decryption --query Parameter.Value --output text --region eu-central-1)
export CLERK_INVITATION_REDIRECT_URL=$(aws ssm get-parameter --name /claimo/backend/CLERK_INVITATION_REDIRECT_URL --with-decryption --query Parameter.Value --output text --region eu-central-1)
export CLERK_USER_CREATED_WEBHOOK_SECRET=$(aws ssm get-parameter --name /claimo/backend/CLERK_USER_CREATED_WEBHOOK_SECRET --with-decryption --query Parameter.Value --output text --region eu-central-1)
export CLERK_USER_DELETED_WEBHOOK_SECRET=$(aws ssm get-parameter --name /claimo/backend/CLERK_USER_DELETED_WEBHOOK_SECRET --with-decryption --query Parameter.Value --output text --region eu-central-1)
export CLERK_INVITATION_CREATED_WEBHOOK_SECRET=$(aws ssm get-parameter --name /claimo/backend/CLERK_INVITATION_CREATED_WEBHOOK_SECRET --with-decryption --query Parameter.Value --output text --region eu-central-1)
export CLERK_INVITATION_ACCEPTED_WEBHOOK_SECRET=$(aws ssm get-parameter --name /claimo/backend/CLERK_INVITATION_ACCEPTED_WEBHOOK_SECRET --with-decryption --query Parameter.Value --output text --region eu-central-1)
export CLERK_INVITATION_REVOKED_WEBHOOK_SECRET=$(aws ssm get-parameter --name /claimo/backend/CLERK_INVITATION_REVOKED_WEBHOOK_SECRET --with-decryption --query Parameter.Value --output text --region eu-central-1)
export AZURE_STORAGE_CONNECTION_STRING=$(aws ssm get-parameter --name /claimo/backend/AZURE_STORAGE_CONNECTION_STRING --with-decryption --query Parameter.Value --output text --region eu-central-1)
export AZURE_STORAGE_CONTAINER_NAME=$(aws ssm get-parameter --name /claimo/backend/AZURE_STORAGE_CONTAINER_NAME --with-decryption --query Parameter.Value --output text --region eu-central-1)
export RESEND_API_KEY=$(aws ssm get-parameter --name /claimo/backend/RESEND_API_KEY --with-decryption --query Parameter.Value --output text --region eu-central-1)
export RESEND_FROM_EMAIL=$(aws ssm get-parameter --name /claimo/backend/RESEND_FROM_EMAIL --with-decryption --query Parameter.Value --output text --region eu-central-1)
export APP_NAME=$(aws ssm get-parameter --name /claimo/backend/APP_NAME --with-decryption --query Parameter.Value --output text --region eu-central-1)
export ACTIVE_PROFILE=$(aws ssm get-parameter --name /claimo/backend/ACTIVE_PROFILE --with-decryption --query Parameter.Value --output text --region eu-central-1)
export ALLOWED_ORIGINS=$(aws ssm get-parameter --name /claimo/backend/ALLOWED_ORIGINS --with-decryption --query Parameter.Value --output text --region eu-central-1)

# Start the application
cd /home/ec2-user/app
nohup /usr/bin/java -jar api-0.0.1-SNAPSHOT.jar > /home/ec2-user/app/app.log 2>&1 &