import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { AnalysisResult } from '../types';

interface ReportGeneratorProps {
  analysisResult: AnalysisResult;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ analysisResult }) => {
  const [showSlackScript, setShowSlackScript] = useState(false);

  const generateAtRiskAndNotStartedReport = () => {
    const workbook = XLSX.utils.book_new();
    
    // Get all learners who are at-risk OR not started from the original data
    // We need to reconstruct this from the analysis result
    const atRiskEmails = new Set(analysisResult.atRiskLearners.map(l => l.email));
    
    // Create data for learners who need attention (at-risk or not started)
    const needsAttentionData: any[] = [];
    
    // Add at-risk learners
    analysisResult.atRiskLearners.forEach(learner => {
      needsAttentionData.push({
        'Email': learner.email,
        'Course Name': learner.courseName,
        'Status Category': 'At Risk',
        'Current Week': learner.currentWeek,
        'Progress Percentage': `${learner.weekPercentage}%`,
        'Risk Level': learner.riskLevel,
        'Week Status': learner.weekStatus,
        'Last Activity': learner.lastActivity,
        'Last Completed Module': learner.lastCompletedModule,
        'Next Action': learner.nextAction,
        'Weeks Since Activity': learner.weeksBeind,
        'Recommended Action': learner.riskLevel === 'High' ? 'Immediate call/meeting' : 'Check-in message'
      });
    });
    
    // Summary by course for needs attention learners
    const courseSummary = analysisResult.courseStats.map(course => ({
      'Course Name': course.courseName,
      'Total Learners': course.totalLearners,
      'At Risk': course.atRisk,
      'Not Started': course.notStarted,
      'Needs Attention Total': course.atRisk + course.notStarted,
      'Attention Percentage': course.totalLearners > 0 ? 
        `${Math.round(((course.atRisk + course.notStarted) / course.totalLearners) * 100)}%` : '0%',
      'In Progress': course.inProgress,
      'Completed': course.completed
    }));
    
    // Summary Sheet
    const totalNeedsAttention = courseSummary.reduce((sum, course) => sum + course['Needs Attention Total'], 0);
    const summaryData = [
      { 'Metric': 'Total Unique Learners', 'Value': analysisResult.totalLearners },
      { 'Metric': 'Learners Needing Attention', 'Value': totalNeedsAttention },
      { 'Metric': '- At Risk Learners', 'Value': atRiskEmails.size },
      { 'Metric': '- Not Started Learners', 'Value': courseSummary.reduce((sum, course) => sum + course['Not Started'], 0) },
      { 'Metric': 'Attention Needed Percentage', 'Value': `${Math.round((totalNeedsAttention / analysisResult.totalLearners) * 100)}%` },
      { 'Metric': 'Total Courses', 'Value': analysisResult.courseStats.length },
      { 'Metric': 'Report Generated', 'Value': new Date().toLocaleDateString() }
    ];
    
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
    // Course Summary Sheet
    const courseSummarySheet = XLSX.utils.json_to_sheet(courseSummary);
    XLSX.utils.book_append_sheet(workbook, courseSummarySheet, 'Course Summary');
    
    // All Learners Needing Attention
    const allNeedsAttentionSheet = XLSX.utils.json_to_sheet(needsAttentionData);
    XLSX.utils.book_append_sheet(workbook, allNeedsAttentionSheet, 'All Learners Need Attention');
    
    // Create separate sheets for each course's learners needing attention
    const courseGroups = new Map<string, any[]>();
    
    // Group at-risk learners by course
    analysisResult.atRiskLearners.forEach(learner => {
      if (!courseGroups.has(learner.courseName)) {
        courseGroups.set(learner.courseName, []);
      }
      courseGroups.get(learner.courseName)!.push({
        'Email': learner.email,
        'Status Category': 'At Risk',
        'Current Week': learner.currentWeek,
        'Progress Percentage': `${learner.weekPercentage}%`,
        'Risk Level': learner.riskLevel,
        'Week Status': learner.weekStatus,
        'Last Activity': learner.lastActivity,
        'Weeks Since Activity': learner.weeksBeind,
        'Recommended Action': learner.riskLevel === 'High' ? 'Immediate call/meeting' : 'Check-in message'
      });
    });
    
    // Add not started learners (we'll need to indicate this in the course stats)
    analysisResult.courseStats.forEach(course => {
      if (course.notStarted > 0) {
        if (!courseGroups.has(course.courseName)) {
          courseGroups.set(course.courseName, []);
        }
        // Add a placeholder entry for not started learners
        courseGroups.get(course.courseName)!.push({
          'Email': `${course.notStarted} learners not started`,
          'Status Category': 'Not Started',
          'Current Week': 'N/A',
          'Progress Percentage': '0%',
          'Risk Level': 'N/A',
          'Week Status': 'Not Started',
          'Last Activity': 'N/A',
          'Weeks Since Activity': 'N/A',
          'Recommended Action': 'Initial outreach and enrollment support'
        });
      }
    });
    
    // Track used sheet names to ensure uniqueness
    const usedSheetNames = new Set(['Summary', 'Course Summary', 'All Learners Need Attention']);
    let courseIndex = 1;
    
    courseGroups.forEach((learners, courseName) => {
      const courseSheet = XLSX.utils.json_to_sheet(learners);
      
      // Create unique sheet name
      let baseSheetName = courseName.replace(/[\\\/\?\*\[\]:]/g, '').substring(0, 12);
      let sheetName = `${baseSheetName} - Action`;
      
      // Ensure uniqueness by adding number if needed
      let finalSheetName = sheetName;
      let counter = 1;
      while (usedSheetNames.has(finalSheetName) || finalSheetName.length > 31) {
        finalSheetName = `${baseSheetName.substring(0, 9)} ${counter} - Action`;
        counter++;
        if (finalSheetName.length > 31) {
          finalSheetName = `Course ${courseIndex} - Action`;
          break;
        }
      }
      
      usedSheetNames.add(finalSheetName);
      XLSX.utils.book_append_sheet(workbook, courseSheet, finalSheetName);
      courseIndex++;
    });
    
    // Generate and download file
    const fileName = `learners-needing-attention-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };



  const generateSlackScriptsByCourse = () => {
    // Group at-risk learners by course
    const learnersByCourse = new Map<string, typeof analysisResult.atRiskLearners>();
    
    analysisResult.atRiskLearners.forEach(learner => {
      if (!learnersByCourse.has(learner.courseName)) {
        learnersByCourse.set(learner.courseName, []);
      }
      learnersByCourse.get(learner.courseName)!.push(learner);
    });

    let scripts = `# Slack Outreach Scripts by Course\n\n`;
    
    learnersByCourse.forEach((learners, courseName) => {
      const highRisk = learners.filter(l => l.riskLevel === 'High');
      const mediumRisk = learners.filter(l => l.riskLevel === 'Medium');
      
      scripts += `## ${courseName}\n`;
      scripts += `**Total At-Risk Learners:** ${learners.length} (${highRisk.length} High Risk, ${mediumRisk.length} Medium Risk)\n\n`;
      
      if (highRisk.length > 0) {
        scripts += `### High Risk Learners - Immediate Action Required\n`;
        scripts += `**Template Message:**\n`;
        scripts += `\`\`\`\n`;
        scripts += `Hi [NAME],\n\n`;
        scripts += `I noticed you haven't made progress in ${courseName} recently. I'd love to help you get back on track!\n\n`;
        scripts += `Would you be available for a quick 15-minute call this week to discuss:\n`;
        scripts += `• Any challenges you're facing\n`;
        scripts += `• Your current schedule and availability\n`;
        scripts += `• Resources that might help\n\n`;
        scripts += `Let me know what works best for you!\n\n`;
        scripts += `Best regards,\n[YOUR_NAME]\n`;
        scripts += `\`\`\`\n\n`;
        
        scripts += `**Individual Learners:**\n`;
        highRisk.forEach(learner => {
          scripts += `- **${learner.email}**: ${learner.weekPercentage}% progress, Week ${learner.currentWeek}\n`;
        });
        scripts += `\n`;
      }
      
      if (mediumRisk.length > 0) {
        scripts += `### Medium Risk Learners - Check-in Recommended\n`;
        scripts += `**Template Message:**\n`;
        scripts += `\`\`\`\n`;
        scripts += `Hi [NAME],\n\n`;
        scripts += `Just checking in on your ${courseName} progress! I see you're making some progress but wanted to see if there's anything I can do to help you stay on track.\n\n`;
        scripts += `Would a quick chat be helpful? I'm here to support your success!\n\n`;
        scripts += `Best,\n[YOUR_NAME]\n`;
        scripts += `\`\`\`\n\n`;
        
        scripts += `**Individual Learners:**\n`;
        mediumRisk.forEach(learner => {
          scripts += `- **${learner.email}**: ${learner.weekPercentage}% progress, Week ${learner.currentWeek}\n`;
        });
        scripts += `\n`;
      }
      
      scripts += `---\n\n`;
    });
    
    scripts += `## General Outreach Tips\n`;
    scripts += `1. **Be supportive, not punitive** - Focus on helping rather than highlighting problems\n`;
    scripts += `2. **Personalize when possible** - Use their name and specific course details\n`;
    scripts += `3. **Offer concrete help** - Mention specific support options\n`;
    scripts += `4. **Follow up appropriately** - If no response in 3-5 days, send a gentle follow-up\n`;
    scripts += `5. **Track engagement** - Note who responds and what support they need\n\n`;
    
    scripts += `## Bulk Actions by Course\n`;
    learnersByCourse.forEach((learners, courseName) => {
      scripts += `### ${courseName}\n`;
      scripts += `- Create a dedicated Slack channel: #${courseName.toLowerCase().replace(/\s+/g, '-')}-support\n`;
      scripts += `- Schedule virtual office hours for this course\n`;
      scripts += `- Share course-specific resources and tips\n`;
      scripts += `- Consider peer mentoring within this course\n\n`;
    });
    
    return scripts;
  };

  const downloadSlackScript = () => {
    const script = generateSlackScriptsByCourse();
    const blob = new Blob([script], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `slack-outreach-scripts-by-course-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'inline-block' }}>
      <button 
        onClick={generateAtRiskAndNotStartedReport}
        style={{ 
          backgroundColor: '#ff8c00', 
          color: 'white', 
          border: 'none', 
          padding: '8px 16px', 
          borderRadius: '4px', 
          marginRight: '10px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        ⚠️ Learners Needing Attention
      </button>
      
      <button 
        onClick={() => setShowSlackScript(!showSlackScript)}
        className="btn btn-primary"
        style={{ marginRight: '10px' }}
      >
        💬 View Slack Scripts
      </button>
      
      {showSlackScript && (
        <button 
          onClick={downloadSlackScript}
          className="btn btn-primary"
        >
          📥 Download Scripts
        </button>
      )}
      
      {showSlackScript && (
        <div className="card" style={{ marginTop: '20px', maxHeight: '400px', overflow: 'auto' }}>
          <h3>Slack Outreach Scripts by Course</h3>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: '1.4' }}>
            {generateSlackScriptsByCourse()}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ReportGenerator;