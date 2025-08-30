# Learner Analytics Dashboard

A privacy-first web application for analyzing learner progress data and identifying at-risk students. Built with React, TypeScript, and AWS services with **zero server-side data processing**.

## Features

- **🔐 Secure Authentication**: AWS Cognito user pool integration
- **📁 File Upload**: Support for CSV and Excel files with drag-and-drop
- **📊 Data Analysis**: Automated identification of at-risk learners (3+ weeks inactive)
- **📈 Interactive Dashboards**: 4 key visualizations for learner insights
- **📋 Report Generation**: Excel reports with course abbreviations and outreach scripts
- **🛡️ Privacy-First**: All processing in browser memory, no server-side data storage
- **🔄 Session-Based**: Data automatically cleared on page refresh or logout

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Charts**: Recharts for interactive visualizations  
- **Authentication**: AWS Cognito User Pool
- **File Processing**: Papa Parse (CSV) + XLSX (Excel)
- **Hosting**: AWS Amplify with CI/CD
- **Infrastructure**: AWS CDK (TypeScript)
- **Backend**: **None** - 100% client-side processing for maximum privacy


## Architecture

<img width="1437" height="1027" alt="image" src="https://github.com/user-attachments/assets/bbfbc621-b621-4ac2-9ef1-3624485040c3" />


### Client-Side Processing
- **React Application**: Handles all data processing in browser memory
- **No Backend APIs**: Zero server-side data processing or storage
- **Privacy by Design**: Files never leave the user's browser session

### AWS Infrastructure
- **Cognito User Pool**: Secure authentication and user management
- **Amplify Hosting**: Static site hosting with global CDN via CloudFront
- **S3**: Static asset storage (HTML, CSS, JS files only)
- **CDK**: Infrastructure as Code for reproducible deployments

## Getting Started

### Prerequisites

- Node.js 18+
- AWS CLI configured with appropriate permissions
- AWS CDK CLI (`npm install -g aws-cdk`)

### Local Development

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd learner-analytics-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Deploy AWS infrastructure:
   ```bash
   cd infrastructure
   npm install
   cdk deploy
   ```

4. Configure environment variables (from CDK outputs):
   ```bash
   # Update src/aws-exports.ts with your Cognito details
   ```

5. Start development server:
   ```bash
   npm start
   ```

## Data Format
### Customizing Column Headers

If your data uses different column names, you can modify the expected headers in:
- **File**: `src/components/FileUpload.tsx`
- **Functions**: `parseCSV()` and `parseExcel()`
- **Look for**: The mapping object that converts column names to internal field names

The parser supports both exact matches and common variations (e.g., "Email" or "email").
By default the application expects CSV/Excel files with these columns:

- Email
- Course Name
- Current Week
- Current Week Name
- Week Status
- Current Week Progress
- Week Percentage
- Last Activity
- Last Completed Module
- Next Action

## Security & Privacy Features

- **🔒 Zero Server-Side Storage**: All data processing happens in browser memory
- **🗑️ Automatic Cleanup**: Files and data cleared on page refresh/logout
- **🔐 Encrypted Transit**: HTTPS/TLS encryption for all communications
- **👤 Secure Authentication**: AWS Cognito with JWT tokens
- **⏱️ Session-Based Lifecycle**: Data exists only during active user session
- **🚫 No Data Persistence**: No databases, no file storage, no data retention
- **🌐 Client-Side Only**: React app processes everything locally

## Analytics Methodology

### At-Risk Learner Identification
- **Primary Criteria**: Learners with "In Progress" status but no activity for 3+ weeks
- **Risk Levels**: 
  - **High Risk**: 6+ weeks since last activity
  - **Medium Risk**: 3-5 weeks since last activity
- **Status Categories**:
  - **Completed** (Green): Finished the course
  - **In Progress** (Blue): Actively engaged
  - **At Risk** (Yellow): In progress but inactive 3+ weeks
  - **Not Started** (Red): Haven't begun the course

### Interactive Visualizations
1. **📊 Learner Status Distribution**: Pie chart showing overall status breakdown
2. **📈 Status by Course**: Stacked bar chart with course abbreviations (AID, CF2, etc.)
3. **📉 Progress Distribution**: Bar chart of completion percentage ranges
4. **📋 Course Statistics**: Summary metrics and totals

### Report Generation
- **📄 Excel Reports**: Detailed learner data organized by course abbreviation tabs
- **💬 Outreach Scripts**: Template messages for learner engagement (platform-agnostic)
- **🎯 Action Items**: Recommended interventions based on risk levels

## Deployment

### Production Deployment

1. **Deploy Infrastructure** (one-time setup):
   ```bash
   cd infrastructure
   cdk deploy
   ```

2. **Connect GitHub Repository**:
   - Link your GitHub repo to the Amplify app created by CDK
   - Amplify will automatically build and deploy on git push

3. **Automatic CI/CD**:
   - Every push to main branch triggers automatic deployment
   - Build process: `npm ci` → `npm run build` → deploy to S3/CloudFront

### Infrastructure Components

The `infrastructure/` directory contains AWS CDK code for:
- **Cognito User Pool**: Authentication and user management
- **Amplify App**: Static hosting with CI/CD pipeline  
- **CloudFormation**: Infrastructure state management
- **Environment Variables**: Automatic injection of AWS resource IDs

## Usage

1. **Login**: Authenticate with AWS Cognito
2. **Upload**: Drop CSV/Excel file in upload area
3. **Analyze**: View automated analysis in dashboard
4. **Report**: Generate Excel reports and Slack scripts

