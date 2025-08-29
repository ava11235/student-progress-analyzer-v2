import React from 'react';
import { AnalysisResult } from '../types';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ReportGenerator from './ReportGenerator';

interface DashboardProps {
  analysisResult: AnalysisResult;
}

// Define specific colors for each status
const STATUS_COLORS: { [key: string]: string } = {
  'Completed': '#28a745',      // Green
  'In Progress': '#007bff',    // Blue  
  'At Risk': '#ffc107',        // Yellow/Orange
  'Not Started': '#dc3545'     // Red
};

// Define colors for progress ranges (gradient from red to green)
const PROGRESS_COLORS: { [key: string]: string } = {
  '0-20%': '#dc3545',    // Red - just started
  '21-40%': '#fd7e14',   // Orange - early progress
  '41-60%': '#ffc107',   // Yellow - halfway
  '61-80%': '#20c997',   // Teal - good progress
  '81-100%': '#28a745'   // Green - nearly/fully complete
};

const Dashboard: React.FC<DashboardProps> = ({ analysisResult }) => {
  const { 
    totalLearners, 
    atRiskLearners, 
    courseStats, 
    progressDistribution, 
    riskDistribution 
  } = analysisResult;

  // Function to create course abbreviations
  const createAbbreviation = (courseName: string): string => {
    // Remove common words and take first letters of remaining words
    const words = courseName
      .replace(/\b(and|or|the|of|in|on|at|to|for|with|by)\b/gi, '') // Remove common words
      .split(/[\s\-_]+/) // Split on spaces, hyphens, underscores
      .filter(word => word.length > 0)
      .map(word => word.charAt(0).toUpperCase());
    
    // Take first 3-4 letters for abbreviation
    return words.slice(0, Math.min(4, words.length)).join('');
  };

  // Create abbreviated course data for the chart
  const abbreviatedCourseStats = courseStats.map(course => ({
    ...course,
    courseAbbrev: createAbbreviation(course.courseName),
    fullName: course.courseName
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Analytics Dashboard</h2>
        <ReportGenerator analysisResult={analysisResult} />
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '15px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Total Learners</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff' }}>{totalLearners}</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '15px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>At-Risk Learners</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#dc3545' }}>{atRiskLearners.length}</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '15px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Courses</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>{courseStats.length}</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="dashboard-grid">
        {/* Learner Status Distribution Pie Chart */}
        <div className="card">
          <h3>Learner Status Distribution</h3>
          <div style={{ marginBottom: '15px', fontSize: '14px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: STATUS_COLORS['Completed'], borderRadius: '2px' }}></div>
                Completed
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: STATUS_COLORS['In Progress'], borderRadius: '2px' }}></div>
                In Progress
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: STATUS_COLORS['At Risk'], borderRadius: '2px' }}></div>
                At Risk (3+ weeks inactive)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: STATUS_COLORS['Not Started'], borderRadius: '2px' }}></div>
                Not Started
              </span>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percentage }) => `${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#8884d8'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend 
                  verticalAlign="bottom" 
                  align="center"
                  iconType="rect"
                  wrapperStyle={{ paddingTop: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Course Status Bar Chart */}
        <div className="card">
          <h3>Learner Status by Course</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={abbreviatedCourseStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="courseAbbrev" 
                  angle={0}
                  textAnchor="middle"
                  height={60}
                  interval={0}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(label) => {
                    const course = abbreviatedCourseStats.find(c => c.courseAbbrev === label);
                    return course ? course.fullName : label;
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right"
                  iconType="rect"
                  wrapperStyle={{ paddingBottom: '20px' }}
                />
                <Bar dataKey="completed" stackId="a" fill={STATUS_COLORS['Completed']} name="Completed" />
                <Bar dataKey="inProgress" stackId="a" fill={STATUS_COLORS['In Progress']} name="In Progress" />
                <Bar dataKey="atRisk" stackId="a" fill={STATUS_COLORS['At Risk']} name="At Risk" />
                <Bar dataKey="notStarted" stackId="a" fill={STATUS_COLORS['Not Started']} name="Not Started" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Progress Distribution */}
        <div className="card">
          <h3>Course Progress Distribution</h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
            Shows how many learners fall into each completion percentage range based on their course progress
          </p>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="range" 
                  label={{ value: 'Completion Percentage', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  label={{ value: 'Number of Learners', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value) => [`${value} learners`, 'Count']}
                  labelFormatter={(label) => `Progress Range: ${label}`}
                />
                <Bar dataKey="count" name="Learners">
                  {progressDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PROGRESS_COLORS[entry.range] || '#007bff'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>


      </div>


    </div>
  );
};

export default Dashboard;