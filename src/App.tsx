import React, { useState } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import Dashboard from './components/Dashboard';
import FileUpload from './components/FileUpload';
import { LearnerData, AnalysisResult } from './types';
import { analyzeLearnerData } from './utils/dataAnalysis';

function App() {
  const [learnerData, setLearnerData] = useState<LearnerData[]>([]);
  const [originalData, setOriginalData] = useState<LearnerData[]>([]);
  const [availableCourses, setAvailableCourses] = useState<string[]>([]);
  const [currentCourse, setCurrentCourse] = useState<string>('');
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [allCoursesOverview, setAllCoursesOverview] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'dashboard' | 'methodology'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Temporary bypass for testing - set to false for production
  const BYPASS_AUTH = false;

  const generateAllCoursesOverview = async (data: LearnerData[], week: number) => {
    const uniqueCourses = Array.from(new Set(data.map(item => item.courseName).filter(Boolean)));
    const coursesOverview = [];
    
    for (const course of uniqueCourses) {
      const courseData = data.filter(learner => learner.courseName === course);
      const courseAnalysis = await analyzeLearnerData(courseData, week);
      
      // Create abbreviation for course name
      const createAbbreviation = (courseName: string): string => {
        const words = courseName
          .replace(/\b(and|or|the|of|in|on|at|to|for|with|by)\b/gi, '')
          .split(/[\s\-_]+/)
          .filter(word => word.length > 0)
          .map(word => word.charAt(0).toUpperCase());
        return words.slice(0, Math.min(4, words.length)).join('');
      };
      
      const courseStats = courseAnalysis.courseStats[0]; // Should have one course
      if (courseStats) {
        coursesOverview.push({
          ...courseStats,
          courseAbbrev: createAbbreviation(course),
          fullName: course
        });
      }
    }
    
    return coursesOverview;
  };

  const handleFileUpload = async (data: LearnerData[], week: number, selectedCourse?: string) => {
    setIsProcessing(true);
    try {
      // Store original data and extract available courses
      setOriginalData(data);
      const uniqueCourses = Array.from(new Set(data.map(item => item.courseName).filter(Boolean)));
      setAvailableCourses(uniqueCourses);
      setCurrentWeek(week);
      setCurrentCourse(selectedCourse || '');
      
      // Generate all courses overview for the chart
      const overview = await generateAllCoursesOverview(data, week);
      setAllCoursesOverview(overview);
      
      // Filter data by selected course (selectedCourse is now required)
      const filteredData = selectedCourse 
        ? data.filter(learner => learner.courseName === selectedCourse)
        : data;
      
      setLearnerData(filteredData);
      const result = await analyzeLearnerData(filteredData, week);
      setAnalysisResult(result);
      setActiveTab('dashboard');
    } catch (error) {
      console.error('Error processing data:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCourseChange = async (newCourse: string) => {
    setIsProcessing(true);
    try {
      setCurrentCourse(newCourse);
      
      // Filter original data by new course
      const filteredData = originalData.filter(learner => learner.courseName === newCourse);
      
      setLearnerData(filteredData);
      const result = await analyzeLearnerData(filteredData, currentWeek);
      setAnalysisResult(result);
    } catch (error) {
      console.error('Error processing course change:', error);
    } finally {
      setIsProcessing(false);
    }
  };



  const renderApp = (user?: any, signOut?: () => void) => (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Learner Analytics Dashboard</h1>
        <div>
          <span style={{ marginRight: '15px' }}>
            Welcome, {BYPASS_AUTH ? 'Test User' : user?.attributes?.email}
          </span>
          {!BYPASS_AUTH && (
            <button onClick={signOut} className="btn btn-primary">Sign Out</button>
          )}
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
              availableCourses={availableCourses}
              currentCourse={currentCourse}
              onCourseChange={handleCourseChange}
              allCoursesData={allCoursesOverview}
            />
          )}

          {activeTab === 'methodology' && (
            <div className="card">
              <h2>Analysis Methodology</h2>
              <div style={{ lineHeight: '1.6' }}>
                <h3>📊 Learner Status Classification System</h3>
                <p>Our system categorizes learners into four distinct status groups based on their current progress and engagement:</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', margin: '20px 0' }}>
                  <div style={{ padding: '15px', backgroundColor: '#d4edda', borderRadius: '8px', border: '1px solid #28a745' }}>
                    <h4 style={{ color: '#28a745', margin: '0 0 10px 0' }}>🟢 Completed</h4>
                    <p style={{ margin: '0', fontSize: '14px' }}>Learners who have successfully finished their course with "Completed" status in the Week Status column.</p>
                  </div>
                  
                  <div style={{ padding: '15px', backgroundColor: '#cce7ff', borderRadius: '8px', border: '1px solid #007bff' }}>
                    <h4 style={{ color: '#007bff', margin: '0 0 10px 0' }}>🔵 In Progress</h4>
                    <p style={{ margin: '0', fontSize: '14px' }}>Learners with "In Progress" status who are actively engaged and on track with their learning schedule.</p>
                  </div>
                  
                  <div style={{ padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #fd7e14' }}>
                    <h4 style={{ color: '#fd7e14', margin: '0 0 10px 0' }}>🟠 At Risk</h4>
                    <p style={{ margin: '0', fontSize: '14px' }}>Learners who are 3+ weeks behind the current program week OR have "In Progress" status but no activity for 3+ weeks.</p>
                  </div>
                  
                  <div style={{ padding: '15px', backgroundColor: '#f8d7da', borderRadius: '8px', border: '1px solid #dc3545' }}>
                    <h4 style={{ color: '#dc3545', margin: '0 0 10px 0' }}>🔴 Not Started</h4>
                    <p style={{ margin: '0', fontSize: '14px' }}>Learners with "Not Started" status who have not yet begun their coursework.</p>
                  </div>
                </div>

                <h3>🎯 At-Risk Identification Algorithm</h3>
                <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #e9ecef', margin: '15px 0' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>Week-Based Analysis</h4>
                  <ol style={{ margin: '0', paddingLeft: '20px' }}>
                    <li><strong>Current Week Input:</strong> You specify the current program week (1-11)</li>
                    <li><strong>Learner Week Comparison:</strong> System compares each learner's current week to program week</li>
                    <li><strong>Behind Schedule Calculation:</strong> If learner is 3+ weeks behind → flagged as "At Risk"</li>
                    <li><strong>Risk Levels:</strong> Medium Risk (3-5 weeks behind), High Risk (6+ weeks behind)</li>
                    <li><strong>Consistent Results:</strong> Based only on week numbers, not dependent on report date</li>
                  </ol>
                </div>

                <h3>📈 Dashboard Visualizations</h3>
                <ul>
                  <li><strong>All Courses Overview:</strong> Stacked bar chart comparing status distribution across all courses</li>
                  <li><strong>Status Distribution:</strong> Pie chart showing percentage breakdown of the 4 status categories</li>
                  <li><strong>Course-Specific Analysis:</strong> Detailed metrics for the selected course</li>
                  <li><strong>Progress Distribution:</strong> Bar chart showing completion percentage ranges (0-20%, 21-40%, etc.)</li>
                </ul>

                <h3>🔒 Privacy & Security</h3>
                <div style={{ backgroundColor: '#d1ecf1', padding: '15px', borderRadius: '8px', border: '1px solid #bee5eb', margin: '15px 0' }}>
                  <ul style={{ margin: '0', paddingLeft: '20px' }}>
                    <li><strong>Client-Side Processing:</strong> All analysis happens in your browser - no data sent to servers</li>
                    <li><strong>Session-Based:</strong> Data automatically cleared when you close the browser</li>
                    <li><strong>No Storage:</strong> Files are never saved or persisted anywhere</li>
                    <li><strong>Secure Authentication:</strong> AWS Cognito provides enterprise-grade security</li>
                  </ul>
                </div>

                <h3>📋 Report Generation</h3>
                <p>The system generates downloadable Excel reports with course-specific tabs and provides templated Slack outreach scripts for immediate learner engagement and intervention strategies.</p>
              </div>
            </div>
          )}
    </div>
  );

  return BYPASS_AUTH ? renderApp() : (
    <Authenticator>
      {({ signOut, user }) => renderApp(user, signOut)}
    </Authenticator>
  );
}

export default App;