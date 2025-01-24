# Deployment Guide

This application is containerized using Docker and can be deployed to EC2 using the following setup.

## Local Development

To run the application locally:

```bash
docker compose up --build
```

The application will be available at:
- http://localhost (via Nginx)
- http://localhost:3000 (direct access to the app)

## EC2 Deployment

1. Launch an EC2 instance with Docker installed
2. Clone the repository
3. Set up environment variables in `.env`
4. Run the deployment:
   ```bash
   ./deploy.sh
   ```

### Setting up Automatic Deployments

1. In your GitHub repository settings, add a webhook:
   - Payload URL: Your EC2 domain + `/webhook`
   - Content type: `application/json`
   - Secret: Create a secure webhook secret
   - Events: Select "Push" events

2. On your EC2 instance:
   - Add the webhook secret to your environment variables
   - Ensure the deploy.sh script is executable: `chmod +x deploy.sh`

### Security Considerations

1. Configure your EC2 security group to allow:
   - HTTP (80) from anywhere
   - SSH (22) from your IP
   - Your webhook endpoint

2. Use environment variables for sensitive data:
   - Database credentials
   - API keys
   - Webhook secrets

3. Set up SSL/TLS with Let's Encrypt for HTTPS

### Monitoring

- Check container logs: `docker compose logs`
- Check container status: `docker compose ps`
- Monitor system resources: `docker stats`

### Troubleshooting

If the application is not accessible:
1. Check container status: `docker compose ps`
2. Check logs: `docker compose logs`
3. Verify Nginx configuration
4. Check EC2 security group settings
5. Verify environment variables are set correctly
