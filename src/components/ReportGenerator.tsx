import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { AnalysisResult, LearnerDirectory } from '../types';

interface ReportGeneratorProps {
  analysisResult: AnalysisResult;
  learnerDirectory?: LearnerDirectory[];
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ analysisResult, learnerDirectory = [] }) => {
  const [showSlackScript, setShowSlackScript] = useState(false);

  // Helper function to get learner info from directory
  const getLearnerInfo = (email: string) => {
    const learner = learnerDirectory.find(l => l.email.toLowerCase() === email.toLowerCase());
    return learner ? {
      firstName: learner.firstName,
      lastName: learner.lastName,
      fullName: `${learner.firstName} ${learner.lastName}`.trim(),
      slackId: learner.slackId
    } : {
      firstName: '',
      lastName: '',
      fullName: '',
      slackId: ''
    };
  };

  // Function to create course abbreviations (same as Dashboard)
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

  const generateAtRiskAndNotStartedReport = () => {
    const workbook = XLSX.utils.book_new();
    
    // Get all learners who are at-risk OR not started from the original data
    // We need to reconstruct this from the analysis result
    const atRiskEmails = new Set(analysisResult.atRiskLearners.map(l => l.email));
    
    // Create data for learners who need attention (at-risk or not started)
    const needsAttentionData: any[] = [];
    
    // Add at-risk learners with directory information
    analysisResult.atRiskLearners.forEach(learner => {
      const learnerInfo = getLearnerInfo(learner.email);
      needsAttentionData.push({
        'Email': learner.email,
        'First Name': learnerInfo.firstName,
        'Last Name': learnerInfo.lastName,
        'Full Name': learnerInfo.fullName,
        'Slack ID': learnerInfo.slackId,
        'Course Name': learner.courseName,
        'Status Category': 'At Risk',
        'Current Week': learner.currentWeek,
        'Progress Percentage': `${learner.weekPercentage}%`,
        'Risk Level': learner.riskLevel,
        'Week Status': learner.weekStatus,
        'Last Activity': learner.lastActivity,
        'Last Completed Module': learner.lastCompletedModule,
        'Next Action': learner.nextAction,
        'Weeks Behind': learner.weeksBeind,
        'Recommended Action': learner.riskLevel === 'High' ? 'Urgent intervention (3 weeks behind)' : 
                             learner.riskLevel === 'Medium' ? 'Schedule check-in (2 weeks behind)' : 
                             'Gentle nudge (1 week behind)'
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
    const learnersWithContactInfo = analysisResult.atRiskLearners.filter(l => {
      const info = getLearnerInfo(l.email);
      return info.firstName || info.slackId;
    }).length;
    
    const summaryData = [
      { 'Metric': 'Total Unique Learners', 'Value': analysisResult.totalLearners },
      { 'Metric': 'Actionable Learners (1-3 weeks behind)', 'Value': atRiskEmails.size },
      { 'Metric': '- Urgent (3 weeks behind)', 'Value': analysisResult.atRiskLearners.filter(l => l.riskLevel === 'High').length },
      { 'Metric': '- Check-in (2 weeks behind)', 'Value': analysisResult.atRiskLearners.filter(l => l.riskLevel === 'Medium').length },
      { 'Metric': '- Nudge (1 week behind)', 'Value': analysisResult.atRiskLearners.filter(l => l.riskLevel === 'Low').length },
      { 'Metric': 'Learner Directory Loaded', 'Value': learnerDirectory.length > 0 ? 'Yes' : 'No' },
      { 'Metric': 'Directory Entries', 'Value': learnerDirectory.length },
      { 'Metric': 'At-Risk Learners with Contact Info', 'Value': `${learnersWithContactInfo}/${atRiskEmails.size}` },
      { 'Metric': 'Contact Info Coverage', 'Value': atRiskEmails.size > 0 ? `${Math.round((learnersWithContactInfo / atRiskEmails.size) * 100)}%` : '0%' },
      { 'Metric': 'Intervention Success Rate Potential', 'Value': `${Math.round((atRiskEmails.size / analysisResult.totalLearners) * 100)}%` },
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
      const learnerInfo = getLearnerInfo(learner.email);
      courseGroups.get(learner.courseName)!.push({
        'Email': learner.email,
        'First Name': learnerInfo.firstName,
        'Last Name': learnerInfo.lastName,
        'Full Name': learnerInfo.fullName,
        'Slack ID': learnerInfo.slackId,
        'Status Category': 'At Risk',
        'Current Week': learner.currentWeek,
        'Progress Percentage': `${learner.weekPercentage}%`,
        'Risk Level': learner.riskLevel,
        'Week Status': learner.weekStatus,
        'Last Activity': learner.lastActivity,
        'Weeks Behind': learner.weeksBeind,
        'Recommended Action': learner.riskLevel === 'High' ? 'Urgent intervention (3 weeks behind)' : 
                             learner.riskLevel === 'Medium' ? 'Schedule check-in (2 weeks behind)' : 
                             'Gentle nudge (1 week behind)'
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
    
    courseGroups.forEach((learners, courseName) => {
      const courseSheet = XLSX.utils.json_to_sheet(learners);
      
      // Create sheet name using course abbreviation
      let sheetName = createAbbreviation(courseName);
      
      // Ensure uniqueness and Excel sheet name limits (31 chars max)
      let finalSheetName = sheetName;
      let counter = 1;
      while (usedSheetNames.has(finalSheetName)) {
        finalSheetName = `${sheetName}${counter}`;
        counter++;
        // If still too long, truncate
        if (finalSheetName.length > 31) {
          finalSheetName = `${sheetName.substring(0, 29)}${counter}`;
        }
      }
      
      usedSheetNames.add(finalSheetName);
      XLSX.utils.book_append_sheet(workbook, courseSheet, finalSheetName);
    });
    
    // Generate and download file
    const fileName = `learners-needing-attention-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };



  const generateSlackScriptsByCourse = () => {
    // Group at-risk learners by course with directory info
    const learnersByCourse = new Map<string, Array<typeof analysisResult.atRiskLearners[0] & {learnerInfo: ReturnType<typeof getLearnerInfo>}>>();
    
    analysisResult.atRiskLearners.forEach(learner => {
      if (!learnersByCourse.has(learner.courseName)) {
        learnersByCourse.set(learner.courseName, []);
      }
      const learnerInfo = getLearnerInfo(learner.email);
      learnersByCourse.get(learner.courseName)!.push({
        ...learner,
        learnerInfo
      });
    });

    let scripts = `# Slack Outreach Scripts by Course\n\n`;
    scripts += `**Directory Status:** ${learnerDirectory.length > 0 ? `✅ ${learnerDirectory.length} learners with contact info` : '❌ No learner directory uploaded'}\n\n`;
    
    learnersByCourse.forEach((learners, courseName) => {
      const highRisk = learners.filter(l => l.riskLevel === 'High');
      const mediumRisk = learners.filter(l => l.riskLevel === 'Medium');
      const lowRisk = learners.filter(l => l.riskLevel === 'Low');
      
      scripts += `## ${courseName}\n`;
      scripts += `**Actionable Learners:** ${learners.length} (${highRisk.length} Urgent, ${mediumRisk.length} Check-in, ${lowRisk.length} Nudge)\n\n`;
      
      if (highRisk.length > 0) {
        scripts += `### 🚨 3 Weeks Behind - Urgent Intervention Required (${highRisk.length} learners)\n`;
        
        // List specific learners with their contact info
        highRisk.forEach(learner => {
          const name = learner.learnerInfo.fullName || learner.email;
          const slackMention = learner.learnerInfo.slackId ? `<@${learner.learnerInfo.slackId}>` : name;
          scripts += `**${name}** (${learner.email})${learner.learnerInfo.slackId ? ` - Slack: ${slackMention}` : ''}\n`;
        });
        scripts += `\n`;
        
        scripts += `**Template Message:**\n`;
        scripts += `\`\`\`\n`;
        scripts += `Hi [NAME],\n\n`;
        scripts += `I see you're about 3 weeks behind in ${courseName}. The good news is you can still catch up! 🚀\n\n`;
        scripts += `Let's schedule a 20-minute call this week to:\n`;
        scripts += `• Create a catch-up plan that works for your schedule\n`;
        scripts += `• Identify any blockers or challenges\n`;
        scripts += `• Set up additional support resources\n\n`;
        scripts += `You've got this - let's get you back on track!\n\n`;
        scripts += `Best regards,\n[YOUR_NAME]\n`;
        scripts += `\`\`\`\n\n`;
        
        // Individual personalized messages if directory is available
        if (learnerDirectory.length > 0) {
          scripts += `**Personalized Messages:**\n`;
          highRisk.forEach(learner => {
            const name = learner.learnerInfo.firstName || 'there';
            const slackMention = learner.learnerInfo.slackId ? `<@${learner.learnerInfo.slackId}>` : learner.email;
            scripts += `\n**For ${learner.learnerInfo.fullName || learner.email}:**\n`;
            scripts += `\`\`\`\n`;
            scripts += `Hi ${name},\n\n`;
            scripts += `I see you're about 3 weeks behind in ${courseName}. The good news is you can still catch up! 🚀\n\n`;
            scripts += `Let's schedule a 20-minute call this week to get you back on track.\n\n`;
            scripts += `Best regards,\n[YOUR_NAME]\n`;
            scripts += `\`\`\`\n`;
            if (learner.learnerInfo.slackId) {
              scripts += `**Slack mention:** ${slackMention}\n`;
            }
          });
          scripts += `\n`;
        }
      }
      
      if (mediumRisk.length > 0) {
        scripts += `### ⚠️ 2 Weeks Behind - Check-in Needed (${mediumRisk.length} learners)\n`;
        
        // List specific learners with their contact info
        mediumRisk.forEach(learner => {
          const name = learner.learnerInfo.fullName || learner.email;
          const slackMention = learner.learnerInfo.slackId ? `<@${learner.learnerInfo.slackId}>` : name;
          scripts += `**${name}** (${learner.email})${learner.learnerInfo.slackId ? ` - Slack: ${slackMention}` : ''}\n`;
        });
        scripts += `\n`;
        
        scripts += `**Template Message:**\n`;
        scripts += `\`\`\`\n`;
        scripts += `Hi [NAME],\n\n`;
        scripts += `Just checking in on your progress in ${courseName}. I noticed you're about 2 weeks behind the current schedule.\n\n`;
        scripts += `How are things going? Any questions or challenges I can help with?\n\n`;
        scripts += `If you'd like, we can set up a quick 15-minute check-in to:\n`;
        scripts += `• Review your progress\n`;
        scripts += `• Adjust your learning plan if needed\n`;
        scripts += `• Make sure you have everything you need to succeed\n\n`;
        scripts += `Let me know how I can support you!\n\n`;
        scripts += `Best regards,\n[YOUR_NAME]\n`;
        scripts += `\`\`\`\n\n`;
        
        // Individual personalized messages if directory is available
        if (learnerDirectory.length > 0) {
          scripts += `**Personalized Messages:**\n`;
          mediumRisk.forEach(learner => {
            const name = learner.learnerInfo.firstName || 'there';
            const slackMention = learner.learnerInfo.slackId ? `<@${learner.learnerInfo.slackId}>` : learner.email;
            scripts += `\n**For ${learner.learnerInfo.fullName || learner.email}:**\n`;
            scripts += `\`\`\`\n`;
            scripts += `Hi ${name},\n\n`;
            scripts += `Just checking in on your ${courseName} progress! How are things going?\n\n`;
            scripts += `Let me know if you need any support!\n\n`;
            scripts += `Best regards,\n[YOUR_NAME]\n`;
            scripts += `\`\`\`\n`;
            if (learner.learnerInfo.slackId) {
              scripts += `**Slack mention:** ${slackMention}\n`;
            }
          });
          scripts += `\n`;
        }
      }
      
      if (lowRisk.length > 0) {
        scripts += `### 💛 1 Week Behind - Gentle Nudge (${lowRisk.length} learners)\n`;
        
        // List specific learners with their contact info
        lowRisk.forEach(learner => {
          const name = learner.learnerInfo.fullName || learner.email;
          const slackMention = learner.learnerInfo.slackId ? `<@${learner.learnerInfo.slackId}>` : name;
          scripts += `**${name}** (${learner.email})${learner.learnerInfo.slackId ? ` - Slack: ${slackMention}` : ''}\n`;
        });
        scripts += `\n`;
        
        scripts += `**Template Message:**\n`;
        scripts += `\`\`\`\n`;
        scripts += `Hi [NAME],\n\n`;
        scripts += `Hope you're doing well! I noticed you're about a week behind in ${courseName}.\n\n`;
        scripts += `No worries - this is totally manageable! 💪\n\n`;
        scripts += `Just wanted to check:\n`;
        scripts += `• Are you finding the material challenging?\n`;
        scripts += `• Do you need any clarification on recent topics?\n`;
        scripts += `• Is your current pace working for your schedule?\n\n`;
        scripts += `Feel free to reach out if you need any support. You're doing great!\n\n`;
        scripts += `Best regards,\n[YOUR_NAME]\n`;
        scripts += `\`\`\`\n\n`;
        
        // Individual personalized messages if directory is available
        if (learnerDirectory.length > 0) {
          scripts += `**Personalized Messages:**\n`;
          lowRisk.forEach(learner => {
            const name = learner.learnerInfo.firstName || 'there';
            const slackMention = learner.learnerInfo.slackId ? `<@${learner.learnerInfo.slackId}>` : learner.email;
            scripts += `\n**For ${learner.learnerInfo.fullName || learner.email}:**\n`;
            scripts += `\`\`\`\n`;
            scripts += `Hi ${name},\n\n`;
            scripts += `Hope you're doing well! Just a gentle nudge on ${courseName} - you're only about a week behind, totally manageable! 💪\n\n`;
            scripts += `Let me know if you need any support!\n\n`;
            scripts += `Best regards,\n[YOUR_NAME]\n`;
            scripts += `\`\`\`\n`;
            if (learner.learnerInfo.slackId) {
              scripts += `**Slack mention:** ${slackMention}\n`;
            }
          });
          scripts += `\n`;
        }
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

  const hasDirectory = learnerDirectory.length > 0;
  const learnersWithContactInfo = analysisResult.atRiskLearners.filter(l => {
    const info = getLearnerInfo(l.email);
    return info.firstName || info.slackId;
  }).length;

  return (
    <div style={{ display: 'inline-block' }}>
      <div style={{ 
        fontSize: '12px', 
        color: hasDirectory ? '#28a745' : '#6c757d', 
        marginBottom: '8px',
        textAlign: 'center'
      }}>
        {hasDirectory 
          ? `✅ Directory: ${learnersWithContactInfo}/${analysisResult.atRiskLearners.length} with contact info`
          : '📋 No learner directory uploaded'
        }
      </div>
      
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
        🎯 Actionable Learners Report
      </button>
      
      <button 
        onClick={() => setShowSlackScript(!showSlackScript)}
        className="btn btn-primary"
        style={{ 
          marginRight: '10px',
          backgroundColor: hasDirectory ? '#28a745' : '#007bff'
        }}
      >
        💬 {hasDirectory ? 'Personalized Scripts' : 'Template Scripts'}
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