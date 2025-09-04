import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { LearnerData, LearnerDirectory } from '../types';

interface FileUploadProps {
  onFileUpload: (data: LearnerData[], currentWeek: number, selectedCourse?: string, directory?: LearnerDirectory[]) => void;
  isProcessing: boolean;
  hasData: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileUpload, 
  isProcessing, 
  hasData
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  const [availableCourses, setAvailableCourses] = useState<string[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [uploadedData, setUploadedData] = useState<LearnerData[]>([]);
  const [learnerDirectory, setLearnerDirectory] = useState<LearnerDirectory[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const directoryInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (file: File): Promise<LearnerData[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          try {
            const data = results.data.map((row: any) => ({
              email: row['Email'] || row['email'] || '',
              courseName: row['Course Name'] || row['courseName'] || '',
              currentWeek: parseInt(row['Current Week'] || row['currentWeek'] || '0'),
              currentWeekName: row['Current Week Name'] || row['currentWeekName'] || '',
              weekStatus: row['Week Status'] || row['weekStatus'] || '',
              currentWeekProgress: row['Current Week Progress'] || row['currentWeekProgress'] || '',
              weekPercentage: parseFloat((row['Week Percentage'] || row['weekPercentage'] || '0').replace('%', '')),
              lastActivity: row['Last Activity'] || row['lastActivity'] || '',
              lastCompletedModule: row['Last Completed Module'] || row['lastCompletedModule'] || '',
              nextAction: row['Next Action'] || row['nextAction'] || ''
            })).filter(item => item.email); // Filter out empty rows
            
            resolve(data);
          } catch (err) {
            reject(new Error('Error parsing CSV data'));
          }
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        }
      });
    });
  };

  const parseDirectoryExcel = (file: File): Promise<LearnerDirectory[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          const parsedData = jsonData.map((row: any) => ({
            email: row['Learner Emailaddress'] || row['Email'] || row['email'] || '',
            firstName: row['Learner Firstname'] || row['First Name'] || row['firstName'] || '',
            lastName: row['Learner Lastname'] || row['Last Name'] || row['lastName'] || '',
            slackId: row['Slack ID'] || row['SlackID'] || row['slackId'] || ''
          })).filter(item => item.email); // Filter out empty rows
          
          resolve(parsedData);
        } catch (err) {
          reject(new Error('Error parsing learner directory Excel file'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading learner directory file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const parseExcel = (file: File): Promise<LearnerData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          const parsedData = jsonData.map((row: any) => ({
            email: row['Email'] || row['email'] || '',
            courseName: row['Course Name'] || row['courseName'] || '',
            currentWeek: parseInt(row['Current Week'] || row['currentWeek'] || '0'),
            currentWeekName: row['Current Week Name'] || row['currentWeekName'] || '',
            weekStatus: row['Week Status'] || row['weekStatus'] || '',
            currentWeekProgress: row['Current Week Progress'] || row['currentWeekProgress'] || '',
            weekPercentage: parseFloat((row['Week Percentage'] || row['weekPercentage'] || '0').toString().replace('%', '')),
            lastActivity: row['Last Activity'] || row['lastActivity'] || '',
            lastCompletedModule: row['Last Completed Module'] || row['lastCompletedModule'] || '',
            nextAction: row['Next Action'] || row['nextAction'] || ''
          })).filter(item => item.email);
          
          resolve(parsedData);
        } catch (err) {
          reject(new Error('Error parsing Excel file'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFile = async (file: File) => {
    setError(null);
    
    if (!file) return;
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    try {
      let data: LearnerData[];
      
      if (fileExtension === 'csv') {
        data = await parseCSV(file);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        data = await parseExcel(file);
      } else {
        throw new Error('Unsupported file format. Please upload CSV or Excel files.');
      }
      
      if (data.length === 0) {
        throw new Error('No valid data found in the file.');
      }
      
      // Extract unique course names and set up course selector
      const uniqueCourses = Array.from(new Set(data.map(item => item.courseName).filter(Boolean)));
      setAvailableCourses(uniqueCourses);
      setUploadedData(data);
      setSelectedCourse(''); // Reset course selection
      
      // Don't proceed to analysis yet - wait for user to select course and week
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error processing file');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleCourseChange = (course: string) => {
    setSelectedCourse(course);
  };

  const handleWeekChange = (week: number) => {
    setCurrentWeek(week);
  };

  const handleDirectoryFile = async (file: File) => {
    setError(null);
    
    if (!file) return;
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    try {
      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const directoryData = await parseDirectoryExcel(file);
        setLearnerDirectory(directoryData);
      } else {
        throw new Error('Learner directory must be an Excel file (.xlsx or .xls)');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error processing learner directory file');
    }
  };

  const handleDirectorySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleDirectoryFile(files[0]);
    }
  };

  const handleProceedToAnalysis = () => {
    if (uploadedData.length > 0 && selectedCourse && currentWeek >= 1) {
      onFileUpload(uploadedData, currentWeek, selectedCourse, learnerDirectory);
    }
  };

  const canProceed = uploadedData.length > 0 && learnerDirectory.length > 0 && selectedCourse && currentWeek >= 1;

  return (
    <div className="card">
      <h2>Learner Analytics Dashboard</h2>
      
      <div style={{ marginBottom: '25px', padding: '25px', backgroundColor: '#f8f9fa', borderRadius: '12px', border: '2px solid #007bff' }}>
        <h2 style={{ marginTop: '0', color: '#007bff', textAlign: 'center', marginBottom: '20px' }}>🎯 Instructor Intervention Assistant</h2>
        <p style={{ marginBottom: '20px', lineHeight: '1.7', fontSize: '16px', textAlign: 'center', color: '#495057' }}>
          <strong>Quickly identify learners who are at risk of falling behind and generate personalized outreach scripts to help them get back on track.</strong>
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          <div style={{ padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
            <strong>Smart Analysis</strong>
            <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Identifies learners 1-3 weeks behind who can still catch up</p>
          </div>
          <div style={{ padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>💬</div>
            <strong>Personalized Scripts</strong>
            <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Ready-to-send Slack messages with learner names</p>
          </div>
          <div style={{ padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📋</div>
            <strong>Action Reports</strong>
            <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Excel reports with contact info and intervention levels</p>
          </div>
        </div>
        
        <div style={{ padding: '15px', backgroundColor: '#d1ecf1', borderRadius: '8px', border: '1px solid #bee5eb', textAlign: 'center' }}>
          <strong style={{ color: '#0c5460' }}>🔒 Privacy & Security:</strong>
          <span style={{ color: '#0c5460' }}> All processing happens in your browser. No data is stored on servers.</span>
        </div>
      </div>
      
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}
      


      {/* Show configuration panel when both files are uploaded */}
      {availableCourses.length > 0 && learnerDirectory.length > 0 && (
        <div style={{ marginBottom: '20px', padding: '25px', backgroundColor: '#e8f5e8', borderRadius: '12px', border: '3px solid #28a745', position: 'relative' }}>
          <div style={{ 
            position: 'absolute', 
            top: '15px', 
            left: '20px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            borderRadius: '50%', 
            width: '30px', 
            height: '30px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            3
          </div>
          <h3 style={{ marginTop: '0', color: '#28a745', marginBottom: '15px', textAlign: 'center' }}>🎯 Configure Analysis & Start</h3>
          <p style={{ marginBottom: '25px', color: '#495057', textAlign: 'center' }}>
            Great! Both files uploaded. Now select your course and current week to generate personalized intervention scripts.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', alignItems: 'start', marginBottom: '25px' }}>
            {/* Current Week Selector */}
            <div>
              <label htmlFor="currentWeek" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>
                Current Program Week *
              </label>
              <input
                id="currentWeek"
                type="number"
                min="1"
                max="11"
                value={currentWeek}
                onChange={(e) => handleWeekChange(parseInt(e.target.value) || 1)}
                style={{
                  width: '120px',
                  padding: '12px 15px',
                  border: currentWeek >= 1 ? '2px solid #28a745' : '2px solid #dc3545',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
              <p style={{ marginTop: '8px', fontSize: '14px', color: '#6c757d', marginBottom: '0' }}>
                Identifies learners 1-3 weeks behind for actionable intervention
              </p>
            </div>

            {/* Course Selector */}
            <div>
              <label htmlFor="courseSelector" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>
                Select Course *
              </label>
              <select
                id="courseSelector"
                value={selectedCourse}
                onChange={(e) => handleCourseChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  border: selectedCourse ? '2px solid #28a745' : '2px solid #dc3545',
                  borderRadius: '6px',
                  fontSize: '16px',
                  backgroundColor: 'white'
                }}
              >
                <option value="">-- Select a Course --</option>
                {availableCourses.map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
              <p style={{ marginTop: '8px', fontSize: '14px', color: '#6c757d', marginBottom: '0' }}>
                Available: {availableCourses.join(', ')}
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleProceedToAnalysis}
              disabled={!canProceed}
              style={{
                padding: '20px 50px',
                fontSize: '20px',
                fontWeight: 'bold',
                color: canProceed ? 'white' : '#6c757d',
                backgroundColor: canProceed ? '#28a745' : '#e9ecef',
                border: 'none',
                borderRadius: '12px',
                cursor: canProceed ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s',
                boxShadow: canProceed ? '0 6px 12px rgba(40,167,69,0.3)' : 'none'
              }}
            >
              {canProceed ? '🚀 Start Analysis' : '⚠️ Complete all steps above'}
            </button>
          </div>
        </div>
      )}

      {/* Show progress when only one file is uploaded */}
      {(uploadedData.length > 0 || learnerDirectory.length > 0) && !(availableCourses.length > 0 && learnerDirectory.length > 0) && (
        <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeaa7', textAlign: 'center' }}>
          <h4 style={{ color: '#856404', margin: '0 0 10px 0' }}>📋 Progress: {uploadedData.length > 0 && learnerDirectory.length > 0 ? '2' : '1'}/2 Files Uploaded</h4>
          <p style={{ margin: '0', color: '#856404' }}>
            {uploadedData.length === 0 && '📊 Still need: Learner progress data'}
            {learnerDirectory.length === 0 && uploadedData.length > 0 && '👥 Still need: Learner directory with contact info'}
          </p>
        </div>
      )}
      
      {/* Step-by-step upload process */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '30px' }}>
        {/* Step 1: Learner Progress Data */}
        <div style={{ 
          border: uploadedData.length > 0 ? '3px solid #28a745' : '2px dashed #007bff', 
          borderRadius: '12px', 
          padding: '25px', 
          textAlign: 'center',
          backgroundColor: uploadedData.length > 0 ? '#f8fff8' : '#f8f9fa',
          cursor: 'pointer',
          position: 'relative'
        }}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          
          <div style={{ 
            position: 'absolute', 
            top: '10px', 
            left: '15px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            borderRadius: '50%', 
            width: '30px', 
            height: '30px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            1
          </div>
          
          {uploadedData.length > 0 ? (
            <div>
              <div style={{ fontSize: '48px', color: '#28a745', marginBottom: '15px' }}>✅</div>
              <h3 style={{ color: '#28a745', margin: '0 0 10px 0' }}>Progress Data Uploaded</h3>
              <p style={{ margin: '0', color: '#28a745', fontWeight: 'bold' }}>
                {uploadedData.length} learners • {availableCourses.length} courses
              </p>
              <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                Click to replace with a different file
              </p>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '48px', color: '#007bff', marginBottom: '15px' }}>📊</div>
              <h3 style={{ color: '#007bff', margin: '0 0 15px 0' }}>Upload Learner Progress Data</h3>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Required: CSV or Excel file</p>
              <p style={{ fontSize: '14px', color: '#666' }}>
                Drop file here or click to browse
              </p>
            </div>
          )}
        </div>

        {/* Step 2: Learner Directory */}
        <div style={{ 
          border: learnerDirectory.length > 0 ? '3px solid #28a745' : '2px dashed #dc3545', 
          borderRadius: '12px', 
          padding: '25px', 
          textAlign: 'center',
          backgroundColor: learnerDirectory.length > 0 ? '#f8fff8' : '#fff5f5',
          cursor: 'pointer',
          position: 'relative'
        }}
        onClick={() => directoryInputRef.current?.click()}
        >
          <input
            ref={directoryInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleDirectorySelect}
            style={{ display: 'none' }}
          />
          
          <div style={{ 
            position: 'absolute', 
            top: '10px', 
            left: '15px', 
            backgroundColor: '#dc3545', 
            color: 'white', 
            borderRadius: '50%', 
            width: '30px', 
            height: '30px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            2
          </div>
          
          {learnerDirectory.length > 0 ? (
            <div>
              <div style={{ fontSize: '48px', color: '#28a745', marginBottom: '15px' }}>✅</div>
              <h3 style={{ color: '#28a745', margin: '0 0 10px 0' }}>Directory Uploaded</h3>
              <p style={{ margin: '0', color: '#28a745', fontWeight: 'bold' }}>
                {learnerDirectory.length} learners with contact info
              </p>
              <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                Click to replace with a different file
              </p>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '48px', color: '#dc3545', marginBottom: '15px' }}>👥</div>
              <h3 style={{ color: '#dc3545', margin: '0 0 15px 0' }}>Upload Learner Directory</h3>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Required: Excel file with contact info</p>
              <p style={{ fontSize: '14px', color: '#666' }}>
                Must include: Email, First Name, Last Name, Slack ID
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
        <h3 style={{ color: '#495057', marginBottom: '15px' }}>📋 Required File Formats</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
          <div>
            <h4 style={{ color: '#007bff', margin: '0 0 10px 0' }}>📊 Learner Progress Data (CSV/Excel)</h4>
            <ul style={{ fontSize: '14px', color: '#666', margin: '0', paddingLeft: '20px' }}>
              <li>Email</li>
              <li>Course Name</li>
              <li>Current Week</li>
              <li>Current Week Name</li>
              <li>Week Status</li>
              <li>Current Week Progress</li>
              <li>Week Percentage</li>
              <li>Last Activity</li>
              <li>Last Completed Module</li>
              <li>Next Action</li>
            </ul>
          </div>
          
          <div>
            <h4 style={{ color: '#dc3545', margin: '0 0 10px 0' }}>👥 Learner Directory (Excel)</h4>
            <ul style={{ fontSize: '14px', color: '#666', margin: '0', paddingLeft: '20px' }}>
              <li>Learner Emailaddress</li>
              <li>Learner Firstname</li>
              <li>Learner Lastname</li>
              <li>Slack ID</li>
            </ul>
            <p style={{ fontSize: '12px', color: '#856404', margin: '10px 0 0 0', fontStyle: 'italic' }}>
              💡 The email addresses must match between both files for proper linking
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;