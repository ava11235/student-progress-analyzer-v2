# Learner Analytics Dashboard

A secure web application for analyzing learner progress data and identifying at-risk students. Built with React, TypeScript, and AWS services.

## Features

- **Secure Authentication**: AWS Cognito user pool integration
- **File Upload**: Support for CSV and Excel files
- **Data Analysis**: Automated identification of at-risk learners
- **Interactive Dashboards**: 4 key visualizations for learner insights
- **Report Generation**: Excel reports and Slack outreach scripts
- **Data Security**: No persistent storage, automatic file deletion

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Charts**: Recharts for interactive visualizations
- **Authentication**: AWS Amplify + Cognito
- **File Processing**: Papa Parse (CSV) + ExcelJS
- **Hosting**: AWS Amplify
- **Backend**: AWS Lambda + API Gateway (planned)

## Getting Started

### Prerequisites

- Node.js 16+
- AWS CLI configured
- AWS Amplify CLI

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure AWS Amplify:
   ```bash
   amplify init
   amplify add auth
   amplify push
   ```

4. Start the development server:
   ```bash
   npm start
   ```

## Data Format

The application expects CSV/Excel files with these columns:

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

## Security Features

- **No Database Storage**: All processing happens in memory
- **Automatic Cleanup**: Files deleted after processing
- **Encrypted Transit**: HTTPS everywhere
- **User Authentication**: Cognito-based login
- **Session-Based**: Data only exists during user session

## Analytics Methodology

### At-Risk Identification
- Primary: Learners 3+ weeks behind current week
- Secondary: Low completion percentages (<50%)
- Risk levels: High, Medium, Low

### Visualizations
1. **Risk Distribution**: Pie chart of at-risk vs on-track learners
2. **Course Status**: Stacked bars showing status by course
3. **Progress Distribution**: Bar chart of completion percentages
4. **Activity Timeline**: Last activity patterns

## Deployment

### AWS Amplify Hosting

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy to Amplify:
   ```bash
   amplify publish
   ```

### Infrastructure as Code

The `infrastructure/` directory contains AWS CDK code for:
- Lambda functions for file processing
- API Gateway endpoints
- S3 temporary storage
- CloudWatch monitoring

## Usage

1. **Login**: Authenticate with AWS Cognito
2. **Upload**: Drop CSV/Excel file in upload area
3. **Analyze**: View automated analysis in dashboard
4. **Report**: Generate Excel reports and Slack scripts
5. **Cleanup**: Delete data when finished

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues or questions, please create a GitHub issue or contact the development team.