#!/bin/bash

echo "🚀 Deploying Learner Analytics Dashboard to AWS..."

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Install root dependencies
echo "📦 Installing dependencies..."
npm install

# Install infrastructure dependencies
echo "📦 Installing infrastructure dependencies..."
cd infrastructure
npm install
cd ..

# Build the React app
echo "🔨 Building React application..."
npm run build

# Bootstrap CDK (if needed)
echo "🏗️  Bootstrapping CDK..."
cd infrastructure
if ! cdk bootstrap 2>/dev/null; then
    echo "⚠️  CDK already bootstrapped or bootstrap failed"
fi

# Deploy infrastructure
echo "☁️  Deploying to AWS..."
cdk deploy --require-approval never

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Check the CDK outputs for your Cognito User Pool ID and Amplify App URL"
echo "2. Create an admin user using the AWS CLI command in DEPLOYMENT.md"
echo "3. Connect your GitHub repository to Amplify for continuous deployment"
echo ""
echo "🔗 Useful links:"
echo "- AWS Amplify Console: https://console.aws.amazon.com/amplify/"
echo "- AWS Cognito Console: https://console.aws.amazon.com/cognito/"