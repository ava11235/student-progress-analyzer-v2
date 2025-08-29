@echo off
echo 🚀 Deploying Learner Analytics Dashboard to AWS...

REM Check if AWS CLI is configured
aws sts get-caller-identity >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ AWS CLI not configured. Please run 'aws configure' first.
    exit /b 1
)

REM Install root dependencies
echo 📦 Installing dependencies...
npm install

REM Install infrastructure dependencies
echo 📦 Installing infrastructure dependencies...
cd infrastructure
npm install
cd ..

REM Build the React app
echo 🔨 Building React application...
npm run build

REM Bootstrap CDK (if needed)
echo 🏗️  Bootstrapping CDK...
cd infrastructure
cdk bootstrap 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  CDK already bootstrapped or bootstrap failed
)

REM Deploy infrastructure
echo ☁️  Deploying to AWS...
cdk deploy --require-approval never

echo ✅ Deployment complete!
echo.
echo 📋 Next steps:
echo 1. Check the CDK outputs for your Cognito User Pool ID and Amplify App URL
echo 2. Create an admin user using the AWS CLI command in DEPLOYMENT.md
echo 3. Connect your GitHub repository to Amplify for continuous deployment
echo.
echo 🔗 Useful links:
echo - AWS Amplify Console: https://console.aws.amazon.com/amplify/
echo - AWS Cognito Console: https://console.aws.amazon.com/cognito/