#!/bin/bash
while IFS='=' read -r key value; do
  # Skip empty lines and comments
  [[ -z "$key" || "$key" == \#* ]] && continue
  aws ssm put-parameter \
    --name "/claimo/frontend/$key" \
    --value "$value" \
    --type "SecureString" \
    --region eu-central-1 \
    --overwrite
  echo "Uploaded $key"
done < .env.prod