import React, { useState } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import Dashboard from './components/Dashboard';
import FileUpload from './components/FileUpload';
import { LearnerData, AnalysisResult } from './types';
import { analyzeLearnerData } from './utils/dataAnalysis';

function App() {
  const [learnerData, setLearnerData] = useState<LearnerData[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'dashboard' | 'methodology'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (data: LearnerData[]) => {
    setIsProcessing(true);
    try {
      setLearnerData(data);
      const result = await analyzeLearnerData(data);
      setAnalysisResult(result);
      setActiveTab('dashboard');
    } catch (error) {
      console.error('Error processing data:', error);
    } finally {
      setIsProcessing(false);
    }
  };



  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div className="container">
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h1>Learner Analytics Dashboard</h1>
            <div>
              <span style={{ marginRight: '15px' }}>Welcome, {user?.attributes?.email}</span>
              <button onClick={signOut} className="btn btn-primary">Sign Out</button>
            </div>
          </header>

          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              Upload Data
            </button>
            <button 
              className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
              disabled={!analysisResult}
            >
              Dashboard
            </button>
            <button 
              className={`tab ${activeTab === 'methodology' ? 'active' : ''}`}
              onClick={() => setActiveTab('methodology')}
            >
              Methodology
            </button>
          </div>

          {activeTab === 'upload' && (
            <FileUpload 
              onFileUpload={handleFileUpload} 
              isProcessing={isProcessing}
              hasData={learnerData.length > 0}
            />
          )}

          {activeTab === 'dashboard' && analysisResult && (
            <Dashboard 
              analysisResult={analysisResult}
            />
          )}

          {activeTab === 'methodology' && (
            <div className="card">
              <h2>Analysis Methodology</h2>
              <div style={{ lineHeight: '1.6' }}>
                <h3>Data Processing Approach</h3>
                <p>Our learner analytics system processes CSV/Excel files containing learner progress data to identify at-risk students and generate actionable insights.</p>
                
                <h3>Learner Status Classification</h3>
                <ul>
                  <li><strong>Completed (Green):</strong> Learners with "Completed" status in Week Status column</li>
                  <li><strong>In Progress (Blue):</strong> Learners with "In Progress" status who are actively engaged</li>
                  <li><strong>At Risk (Yellow):</strong> "In Progress" learners whose last activity was 3+ weeks ago</li>
                  <li><strong>Not Started (Red):</strong> Learners with "Not Started" status in Week Status column</li>
                </ul>

                <h3>At-Risk Identification Method</h3>
                <ul>
                  <li><strong>Activity-Based:</strong> Uses "Last Activity" date to identify disengaged learners</li>
                  <li><strong>3+ Week Threshold:</strong> Learners with no activity for 3 or more weeks are flagged</li>
                  <li><strong>High vs Medium Risk:</strong> 6+ weeks = High Risk, 3-5 weeks = Medium Risk</li>
                  <li><strong>Only In Progress:</strong> Only considers learners currently "In Progress", not those who haven't started</li>
                </ul>

                <h3>Visualizations</h3>
                <ul>
                  <li><strong>At-Risk Distribution:</strong> Pie chart showing proportion of at-risk vs. on-track learners</li>
                  <li><strong>Status by Course:</strong> Stacked bar chart displaying learner status distribution across courses</li>
                  <li><strong>Progress Distribution:</strong> Bar chart showing completion percentage ranges</li>
                  <li><strong>Weekly Activity:</strong> Timeline showing last activity patterns</li>
                </ul>

                <h3>Security & Privacy</h3>
                <ul>
                  <li>All data processing occurs in memory - no persistent storage</li>
                  <li>Files are automatically deleted after processing</li>
                  <li>AWS Cognito provides secure authentication</li>
                  <li>All communications encrypted via HTTPS</li>
                </ul>

                <h3>Report Generation</h3>
                <p>The system generates Excel reports with at-risk learner details and provides templated outreach scripts for Slack communication, enabling immediate intervention strategies.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </Authenticator>
  );
}

export default App;