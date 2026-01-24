# Docker Secrets

This directory contains secret files for Docker Compose production deployment.

## Setup

Create the following files in this directory (each file should contain a single value, no newline at the end):

### Required Files

```bash
# Database user
echo -n "goals_prod_user" > db_user.txt

# Database password (generate a strong password)
echo -n "$(openssl rand -base64 32)" > db_password.txt

# JWT signing secret (generate a strong secret)
echo -n "$(openssl rand -base64 64)" > jwt_secret.txt
```

### Optional Files

```bash
# Resend API key for email
echo -n "re_your_api_key" > resend_api_key.txt

# Anthropic API key for AI features
echo -n "sk-ant-your_api_key" > anthropic_api_key.txt
```

## Security Notes

1. **Never commit secret files to git** - They are ignored by .gitignore
2. **Use strong, randomly generated passwords** - Use `openssl rand -base64 32` or similar
3. **Rotate secrets regularly** - Especially JWT_SECRET and database passwords
4. **Backup secrets securely** - Store in a password manager or secrets vault

## Alternative: Environment Variables

Instead of file-based secrets, you can use environment variables directly:

```bash
export DB_USER=goals_prod_user
export DB_PASSWORD=your_strong_password
export JWT_SECRET=your_jwt_secret
docker compose -f docker-compose.prod.yml up
```

For production environments, consider using:

- Docker Swarm secrets
- Kubernetes secrets
- AWS Secrets Manager
- HashiCorp Vault
