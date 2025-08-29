import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { LearnerData } from '../types';

interface FileUploadProps {
  onFileUpload: (data: LearnerData[]) => void;
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      
      onFileUpload(data);
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

  return (
    <div className="card">
      <h2>Learner Analytics Dashboard</h2>
      
      <div style={{ marginBottom: '25px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
        <h3 style={{ marginTop: '0', color: '#495057' }}>What This Tool Does</h3>
        <p style={{ marginBottom: '15px', lineHeight: '1.6' }}>
          This analytics dashboard helps you identify at-risk learners and track course progress across your organization. 
          Simply upload your learner data file and get instant insights including:
        </p>
        <ul style={{ marginBottom: '15px', paddingLeft: '20px' }}>
          <li>At-risk learner identification (3+ weeks inactive)</li>
          <li>Course completion status breakdown</li>
          <li>Progress distribution analysis</li>
          <li>Downloadable Excel reports with outreach scripts</li>
        </ul>
        <div style={{ padding: '12px', backgroundColor: '#d1ecf1', borderRadius: '6px', border: '1px solid #bee5eb' }}>
          <strong style={{ color: '#0c5460' }}>🔒 Privacy & Security:</strong>
          <span style={{ color: '#0c5460' }}> Your data is processed entirely in memory and is never stored on our servers. 
          Files are automatically cleared after processing, ensuring complete data privacy.</span>
        </div>
      </div>
      
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}
      
      {hasData && (
        <div className="alert alert-success">
          Data uploaded successfully! Switch to the Dashboard tab to view analysis.
        </div>
      )}
      
      <div
        className={`upload-area ${dragOver ? 'dragover' : ''}`}
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
        
        {isProcessing ? (
          <div>
            <p>Processing file...</p>
            <div style={{ fontSize: '24px' }}>⏳</div>
          </div>
        ) : (
          <div>
            <p>Drop your CSV or Excel file here, or click to browse</p>
            <p style={{ fontSize: '14px', color: '#666' }}>
              Supported formats: .csv, .xlsx, .xls
            </p>
            <div style={{ fontSize: '48px', color: '#ccc' }}>📁</div>
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h3>Expected Columns:</h3>
        <ul>
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
    </div>
  );
};

export default FileUpload;