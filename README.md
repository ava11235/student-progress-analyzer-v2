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
- 🤖 AI Insights - Natural language chatbot for instant learner analytics with interactive visualizations and actionable recommendations.

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Charts**: Recharts for interactive visualizations  
- **Authentication**: AWS Cognito User Pool
- **File Processing**: Papa Parse (CSV) + XLSX (Excel)
- **Hosting**: AWS Amplify with CI/CD
- **Infrastructure**: AWS CDK (TypeScript)
- **Backend**: **None** - 100% client-side processing for maximum privacy


## Architecture

<img width="1437" height="1018" alt="image" src="https://github.com/user-attachments/assets/77956da2-09c8-474b-8997-230d192cc723" />


### Client-Side Processing
- **React Application**: Handles all data processing in browser memory
- **No Backend APIs**: Zero server-side data processing or storage
- **Privacy by Design**: Files never leave the user's browser session

### AWS Infrastructure
- **Cognito User Pool**: Secure authentication and user management
- **Amplify Hosting**: Static site hosting with global CDN via CloudFront
- **CDK**: Infrastructure as Code for reproducible deployments






