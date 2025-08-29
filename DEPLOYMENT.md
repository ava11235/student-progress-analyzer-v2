# Deployment Guide - Learner Analytics Dashboard

## Prerequisites

1. **AWS CLI configured** with appropriate permissions
2. **Node.js 18+** installed
3. **AWS CDK** installed globally: `npm install -g aws-cdk`

## Quick Deployment Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Bootstrap CDK (First time only)
```bash
npm run cdk:bootstrap
```

### 3. Deploy Infrastructure
```bash
npm run deploy
```

This will:
- Build the React application
- Deploy Cognito User Pool for authentication
- Deploy Amplify App for hosting
- Output the configuration values

### 4. Connect GitHub Repository (Manual Step)

After deployment, you'll need to connect your GitHub repository to Amplify:

1. Go to AWS Amplify Console
2. Find your app: "learner-analytics-dashboard"
3. Connect your GitHub repository
4. Set branch to `main`
5. Amplify will automatically deploy on git pushes

## Environment Variables

The following environment variables are automatically configured:

- `REACT_APP_USER_POOL_ID` - Cognito User Pool ID
- `REACT_APP_USER_POOL_CLIENT_ID` - Cognito Client ID  
- `REACT_APP_AWS_REGION` - AWS Region

## Post-Deployment

### Create Admin User
```bash
aws cognito-idp admin-create-user \
  --user-pool-id <USER_POOL_ID> \
  --username admin@yourcompany.com \
  --user-attributes Name=email,Value=admin@yourcompany.com \
  --temporary-password TempPass123! \
  --message-action SUPPRESS
```

### Access the Application
1. Visit the Amplify App URL (shown in CDK outputs)
2. Sign in with the admin credentials
3. You'll be prompted to change the temporary password

## Security Features

- ✅ **No Data Storage**: All processing happens in browser memory
- ✅ **Cognito Authentication**: Secure user management
- ✅ **HTTPS Only**: All traffic encrypted
- ✅ **Auto-logout**: Session management handled by Cognito

## Cleanup

To remove all AWS resources:
```bash
npm run cdk:destroy
```

## Troubleshooting

### Common Issues

1. **CDK Bootstrap Error**: Make sure AWS CLI is configured with proper permissions
2. **Build Failures**: Check Node.js version (requires 18+)
3. **Authentication Issues**: Verify Cognito configuration in aws-exports.ts

### Useful Commands

```bash
# Check CDK status
cd infrastructure && cdk ls

# View CDK outputs
cd infrastructure && cdk deploy --outputs-file outputs.json

# Check Amplify build logs
aws amplify list-jobs --app-id <APP_ID> --branch-name main
```