import React from 'react';
import { AnalysisResult } from '../types';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ReportGenerator from './ReportGenerator';

interface DashboardProps {
  analysisResult: AnalysisResult;
  availableCourses?: string[];
  currentCourse?: string;
  onCourseChange?: (course: string) => void;
  allCoursesData?: any[]; // Data for all courses overview
}

// Define specific colors for each status
const STATUS_COLORS: { [key: string]: string } = {
  'Completed': '#28a745',      // Green
  'In Progress': '#007bff',    // Blue  
  'At Risk': '#fd7e14',        // Light Orange
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

const Dashboard: React.FC<DashboardProps> = ({ 
  analysisResult, 
  availableCourses = [], 
  currentCourse = '', 
  onCourseChange,
  allCoursesData = []
}) => {
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

  // Determine if we're showing a filtered view
  const isFiltered = availableCourses.length > 1 && currentCourse !== '';
  const displayedCourse = isFiltered ? currentCourse : 'All Courses';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2>Analytics Dashboard</h2>
          <div style={{ 
            fontSize: '14px', 
            color: '#6c757d',
            marginTop: '5px',
            padding: '4px 8px',
            backgroundColor: isFiltered ? '#e3f2fd' : '#f8f9fa',
            borderRadius: '4px',
            border: `1px solid ${isFiltered ? '#bbdefb' : '#e9ecef'}`,
            display: 'inline-block'
          }}>
            {isFiltered ? `📊 Course: ${displayedCourse} (${totalLearners} learners)` : `📈 Manager View: All Courses (${totalLearners} learners)`}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* Course Switcher */}
          {availableCourses.length > 1 && onCourseChange && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '2px solid #007bff',
              boxShadow: '0 2px 4px rgba(0,123,255,0.1)'
            }}>
              <label htmlFor="courseSwitcher" style={{ 
                display: 'block', 
                fontSize: '14px', 
                color: '#007bff', 
                marginBottom: '6px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                🔄 Switch Course
              </label>
              <select
                id="courseSwitcher"
                value={currentCourse}
                onChange={(e) => onCourseChange(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '2px solid #007bff',
                  borderRadius: '6px',
                  fontSize: '15px',
                  fontWeight: '600',
                  backgroundColor: 'white',
                  minWidth: '220px',
                  color: '#495057',
                  cursor: 'pointer'
                }}
              >
                {availableCourses.map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
            </div>
          )}
          
          <ReportGenerator analysisResult={analysisResult} />
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '15px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Total Learners</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff' }}>{totalLearners}</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '15px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>At-Risk Learners</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fd7e14' }}>{atRiskLearners.length}</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '15px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Courses</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>{courseStats.length}</div>
        </div>
      </div>

      {/* Course Overview Chart - Show when multiple courses available */}
      {availableCourses.length > 1 && allCoursesData.length > 0 && (
        <div className="card" style={{ marginBottom: '30px', padding: '25px' }}>
          <h3>📊 All Courses Overview</h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
            Total learners and status breakdown across all available courses
          </p>
          <div className="chart-container" style={{ height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={allCoursesData} margin={{ top: 30, right: 30, left: 90, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="courseAbbrev" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  fontSize={12}
                />
                <YAxis 
                  label={{ 
                    value: 'Number of Learners', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle' }
                  }}
                  domain={[0, (dataMax: number) => Math.max(dataMax, Math.ceil(dataMax * 1.05))]}
                  allowDecimals={false}
                  width={80}
                />
                <Tooltip 
                  labelFormatter={(label) => {
                    const course = allCoursesData.find(c => c.courseAbbrev === label);
                    return course ? `${course.fullName} (${course.totalLearners} total)` : label;
                  }}
                  formatter={(value, name) => [value, name]}
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
      )}

      {/* Charts Grid */}
      <div className="dashboard-grid">
        {/* Learner Status Bar Chart */}
        <div className="card">
          <h3>{isFiltered ? `${displayedCourse} - Status Breakdown` : 'All Courses - Status Breakdown'}</h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
            {isFiltered 
              ? `Status breakdown for ${totalLearners} learners in ${displayedCourse}` 
              : `Combined status breakdown for ${totalLearners} learners across all courses`
            }
          </p>
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
                <YAxis 
                  label={{ 
                    value: 'Number of Learners', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle' }
                  }}
                  domain={[0, (dataMax: number) => Math.max(dataMax, Math.ceil(dataMax * 1.05))]}
                  allowDecimals={false}
                  width={80}
                />
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
          <h3>{isFiltered ? `${displayedCourse} - Progress Distribution` : 'All Courses - Progress Distribution'}</h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
            {isFiltered 
              ? `Progress percentage distribution for learners in ${displayedCourse}` 
              : `Combined progress percentage distribution across all courses`
            }
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