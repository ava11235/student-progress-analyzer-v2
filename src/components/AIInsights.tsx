import React, { useState, useRef, useEffect } from 'react';
import { AnalysisResult, LearnerDirectory } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AIInsightsProps {
  analysisResult: AnalysisResult;
  learnerDirectory?: LearnerDirectory[];
  availableCourses?: string[];
  currentCourse?: string;
  allCoursesData?: any[];
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  chart?: React.ReactNode;
}

const STATUS_COLORS: { [key: string]: string } = {
  'Completed': '#28a745',
  'In Progress': '#007bff',
  'At Risk': '#fd7e14',
  'Not Started': '#dc3545'
};

const AIInsights: React.FC<AIInsightsProps> = ({ 
  analysisResult, 
  learnerDirectory = [], 
  availableCourses = [],
  currentCourse = '',
  allCoursesData = []
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Query processing engine
  const processQuery = (query: string): { response: string; chart?: React.ReactNode } => {
    const lowerQuery = query.toLowerCase();
    
    // Helper function to get scope label
    const getScopeLabel = () => {
      if (currentCourse && analysisResult.courseStats.length === 1) {
        return `📚 **Course: ${currentCourse}**`;
      } else if (analysisResult.courseStats.length > 1) {
        return `🌐 **All Courses Combined** (${analysisResult.courseStats.length} courses)`;
      } else {
        return `📊 **Analysis Scope**`;
      }
    };
    
    // Completion rate queries
    if (lowerQuery.includes('completion rate') || lowerQuery.includes('complete')) {
      const totalLearners = analysisResult.totalLearners;
      const completedLearners = analysisResult.courseStats.reduce((sum, course) => sum + course.completed, 0);
      const completionRate = totalLearners > 0 ? Math.round((completedLearners / totalLearners) * 100) : 0;
      
      const scopeLabel = getScopeLabel();
      const courseDetails = currentCourse && analysisResult.courseStats.length === 1 
        ? `\n• Course: ${currentCourse}\n• Learners in this course: ${totalLearners}`
        : `\n• Courses included: ${analysisResult.courseStats.map(c => c.courseName).join(', ')}\n• Total learners across all courses: ${totalLearners}`;
      
      return {
        response: `${scopeLabel}\n\n📊 **Completion Rate Analysis**${courseDetails}\n• Completion rate: ${completionRate}%\n• Completed learners: ${completedLearners}/${totalLearners}\n\nThis shows ${completionRate >= 70 ? 'strong' : completionRate >= 50 ? 'moderate' : 'concerning'} completion performance.`,
        chart: (
          <div style={{ height: '200px', width: '100%' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Completed', value: completedLearners, fill: STATUS_COLORS['Completed'] },
                    { name: 'Not Completed', value: totalLearners - completedLearners, fill: '#e9ecef' }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )
      };
    }

    // At-risk/attention queries
    if (lowerQuery.includes('at risk') || lowerQuery.includes('attention') || lowerQuery.includes('behind')) {
      const atRiskCount = analysisResult.atRiskLearners.length;
      const totalLearners = analysisResult.totalLearners;
      const atRiskRate = totalLearners > 0 ? Math.round((atRiskCount / totalLearners) * 100) : 0;
      
      const riskBreakdown = {
        high: analysisResult.atRiskLearners.filter(l => l.riskLevel === 'High').length,
        medium: analysisResult.atRiskLearners.filter(l => l.riskLevel === 'Medium').length,
        low: analysisResult.atRiskLearners.filter(l => l.riskLevel === 'Low').length
      };

      const scopeLabel = getScopeLabel();
      const courseContext = currentCourse && analysisResult.courseStats.length === 1 
        ? `\n• Analyzing: ${currentCourse} only`
        : `\n• Analyzing: ${analysisResult.courseStats.map(c => c.courseName).join(', ')}`;

      return {
        response: `${scopeLabel}\n\n⚠️ **At-Risk Learner Analysis**${courseContext}\n• Total at-risk learners: ${atRiskCount} (${atRiskRate}%)\n• High risk (3 weeks behind): ${riskBreakdown.high}\n• Medium risk (2 weeks behind): ${riskBreakdown.medium}\n• Low risk (1 week behind): ${riskBreakdown.low}\n\n${atRiskRate > 20 ? 'This indicates significant intervention needs.' : atRiskRate > 10 ? 'Moderate intervention required.' : 'Low intervention needs - good performance!'}`,
        chart: (
          <div style={{ height: '200px', width: '100%' }}>
            <ResponsiveContainer>
              <BarChart data={[
                { name: 'High Risk', count: riskBreakdown.high, fill: '#dc3545' },
                { name: 'Medium Risk', count: riskBreakdown.medium, fill: '#fd7e14' },
                { name: 'Low Risk', count: riskBreakdown.low, fill: '#ffc107' }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )
      };
    }

    // Specific course attention queries
    if (lowerQuery.includes('course') && (lowerQuery.includes('most attention') || lowerQuery.includes('needs attention') || lowerQuery.includes('worst') || lowerQuery.includes('struggling'))) {
      const coursesToAnalyze = allCoursesData.length > 0 ? allCoursesData : analysisResult.courseStats;
      
      const coursePerformance = coursesToAnalyze.map(course => ({
        fullName: course.courseName,
        completionRate: course.totalLearners > 0 ? Math.round((course.completed / course.totalLearners) * 100) : 0,
        atRiskRate: course.totalLearners > 0 ? Math.round((course.atRisk / course.totalLearners) * 100) : 0,
        notStartedRate: course.totalLearners > 0 ? Math.round((course.notStarted / course.totalLearners) * 100) : 0,
        totalLearners: course.totalLearners,
        // Calculate attention score (higher = needs more attention)
        attentionScore: course.totalLearners > 0 ? 
          (course.atRisk * 3) + (course.notStarted * 2) + (course.totalLearners - course.completed - course.atRisk - course.notStarted) : 0
      })).sort((a, b) => b.attentionScore - a.attentionScore);

      const needsAttention = coursePerformance[0];
      const scopeLabel = coursePerformance.length > 1 
        ? `🌐 **All Courses Analysis** (${coursePerformance.length} courses)`
        : `📚 **Single Course: ${coursePerformance[0]?.fullName}**`;

      return {
        response: `${scopeLabel}\n\n🚨 **Course Needing Most Attention**\n• **${needsAttention.fullName}**\n• Completion rate: ${needsAttention.completionRate}%\n• At-risk learners: ${needsAttention.atRiskRate}%\n• Not started: ${needsAttention.notStartedRate}%\n• Total learners: ${needsAttention.totalLearners}\n\n📋 **All Courses by Attention Needed:**\n${coursePerformance.map((course, index) => 
          `${index + 1}. ${course.fullName}: ${course.completionRate}% completion, ${course.atRiskRate}% at-risk`
        ).join('\n')}\n\n💡 **Recommendation:** Focus intervention efforts on ${needsAttention.fullName} first, then work down the list.`
      };
    }

    // Specific course performing well queries  
    if (lowerQuery.includes('course') && (lowerQuery.includes('least attention') || lowerQuery.includes('best') || lowerQuery.includes('performing well') || lowerQuery.includes('doing well'))) {
      const coursesToAnalyze = allCoursesData.length > 0 ? allCoursesData : analysisResult.courseStats;
      
      const coursePerformance = coursesToAnalyze.map(course => ({
        fullName: course.courseName,
        completionRate: course.totalLearners > 0 ? Math.round((course.completed / course.totalLearners) * 100) : 0,
        atRiskRate: course.totalLearners > 0 ? Math.round((course.atRisk / course.totalLearners) * 100) : 0,
        inProgressRate: course.totalLearners > 0 ? Math.round((course.inProgress / course.totalLearners) * 100) : 0,
        totalLearners: course.totalLearners
      })).sort((a, b) => b.completionRate - a.completionRate);

      const bestPerforming = coursePerformance[0];
      const scopeLabel = coursePerformance.length > 1 
        ? `🌐 **All Courses Analysis** (${coursePerformance.length} courses)`
        : `📚 **Single Course: ${coursePerformance[0]?.fullName}**`;

      return {
        response: `${scopeLabel}\n\n🏆 **Best Performing Course**\n• **${bestPerforming.fullName}**\n• Completion rate: ${bestPerforming.completionRate}%\n• At-risk learners: ${bestPerforming.atRiskRate}%\n• In progress: ${bestPerforming.inProgressRate}%\n• Total learners: ${bestPerforming.totalLearners}\n\n📈 **All Courses by Performance:**\n${coursePerformance.map((course, index) => 
          `${index + 1}. ${course.fullName}: ${course.completionRate}% completion, ${course.atRiskRate}% at-risk`
        ).join('\n')}\n\n💡 **Insight:** ${bestPerforming.fullName} is your model course - consider what's working well there and apply those practices to other courses.`
      };
    }

    // General course comparison queries
    if (lowerQuery.includes('course') && (lowerQuery.includes('compare') || lowerQuery.includes('performance'))) {
      // For course comparison, always use all courses data if available
      const coursesToAnalyze = allCoursesData.length > 0 ? allCoursesData : analysisResult.courseStats;
      
      const coursePerformance = coursesToAnalyze.map(course => ({
        name: course.courseName.length > 20 ? course.courseName.substring(0, 20) + '...' : course.courseName,
        fullName: course.courseName,
        completionRate: course.totalLearners > 0 ? Math.round((course.completed / course.totalLearners) * 100) : 0,
        atRiskRate: course.totalLearners > 0 ? Math.round((course.atRisk / course.totalLearners) * 100) : 0,
        totalLearners: course.totalLearners
      })).sort((a, b) => b.completionRate - a.completionRate);

      const bestCourse = coursePerformance[0];
      const worstCourse = coursePerformance[coursePerformance.length - 1];

      const scopeLabel = coursePerformance.length > 1 
        ? `🌐 **All Courses Comparison** (${coursePerformance.length} courses)`
        : `📚 **Single Course Analysis: ${coursePerformance[0]?.fullName}**`;

      return {
        response: `${scopeLabel}\n\n🏆 **Performance Ranking**\n• Best performing: ${bestCourse?.fullName} (${bestCourse?.completionRate}% completion)\n• Needs attention: ${worstCourse?.fullName} (${worstCourse?.completionRate}% completion)\n\n📊 **All Courses:**\n${coursePerformance.map((course, index) => `${index + 1}. ${course.fullName}: ${course.completionRate}% completion, ${course.atRiskRate}% at-risk`).join('\n')}\n\nFocus intervention efforts on courses with lower completion rates and higher at-risk percentages.`,
        chart: (
          <div style={{ height: '250px', width: '100%' }}>
            <ResponsiveContainer>
              <BarChart data={coursePerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis label={{ value: 'Percentage', angle: -90, position: 'insideLeft' }} />
                <Tooltip labelFormatter={(label) => {
                  const course = coursePerformance.find(c => c.name === label);
                  return course?.fullName || label;
                }} />
                <Legend />
                <Bar dataKey="completionRate" fill={STATUS_COLORS['Completed']} name="Completion Rate %" />
                <Bar dataKey="atRiskRate" fill={STATUS_COLORS['At Risk']} name="At-Risk Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )
      };
    }

    // Progress trends
    if (lowerQuery.includes('trend') || lowerQuery.includes('progress') || lowerQuery.includes('distribution')) {
      const progressData = analysisResult.progressDistribution.map(item => ({
        range: item.range,
        count: item.count,
        percentage: analysisResult.totalLearners > 0 ? Math.round((item.count / analysisResult.totalLearners) * 100) : 0
      }));

      const lowProgress = progressData.filter(p => p.range.includes('0-20') || p.range.includes('21-40')).reduce((sum, p) => sum + p.count, 0);
      const highProgress = progressData.filter(p => p.range.includes('81-100')).reduce((sum, p) => sum + p.count, 0);

      const scopeLabel = getScopeLabel();
      const courseContext = currentCourse && analysisResult.courseStats.length === 1 
        ? `\n• Course: ${currentCourse}`
        : `\n• Courses: ${analysisResult.courseStats.map(c => c.courseName).join(', ')}`;

      return {
        response: `${scopeLabel}\n\n📈 **Progress Distribution Trends**${courseContext}\n• Learners with high progress (81-100%): ${highProgress}\n• Learners with low progress (0-40%): ${lowProgress}\n• Most common range: ${progressData.sort((a, b) => b.count - a.count)[0]?.range}\n• Total learners analyzed: ${analysisResult.totalLearners}\n\n${lowProgress > highProgress ? 'Many learners are struggling with progress.' : 'Good overall progress distribution!'}`,
        chart: (
          <div style={{ height: '200px', width: '100%' }}>
            <ResponsiveContainer>
              <BarChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip formatter={(value, name) => [value, name === 'count' ? 'Learners' : name]} />
                <Bar dataKey="count" fill="#007bff" name="Learners" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )
      };
    }

    // Main insights summary
    if (lowerQuery.includes('insight') || lowerQuery.includes('summary') || lowerQuery.includes('overview')) {
      const totalLearners = analysisResult.totalLearners;
      const completedCount = analysisResult.courseStats.reduce((sum, course) => sum + course.completed, 0);
      const atRiskCount = analysisResult.atRiskLearners.length;
      const completionRate = totalLearners > 0 ? Math.round((completedCount / totalLearners) * 100) : 0;
      const atRiskRate = totalLearners > 0 ? Math.round((atRiskCount / totalLearners) * 100) : 0;
      
      const bestCourse = analysisResult.courseStats.reduce((best, course) => {
        const courseRate = course.totalLearners > 0 ? (course.completed / course.totalLearners) : 0;
        const bestRate = best.totalLearners > 0 ? (best.completed / best.totalLearners) : 0;
        return courseRate > bestRate ? course : best;
      });

      const scopeLabel = getScopeLabel();
      const courseList = currentCourse && analysisResult.courseStats.length === 1 
        ? `\n📚 **Course Analyzed:** ${currentCourse}`
        : `\n📚 **Courses Analyzed:** ${analysisResult.courseStats.map(c => c.courseName).join(', ')}`;

      return {
        response: `${scopeLabel}\n\n💡 **Key Insights Summary**${courseList}\n\n📊 **Overall Performance**\n• Total learners: ${totalLearners}\n• Completion rate: ${completionRate}%\n• At-risk learners: ${atRiskCount} (${atRiskRate}%)\n\n🏆 **Top Performer**\n• ${bestCourse.courseName}: ${bestCourse.totalLearners > 0 ? Math.round((bestCourse.completed / bestCourse.totalLearners) * 100) : 0}% completion\n\n🎯 **Recommendations**\n${atRiskRate > 15 ? '• High intervention needed - focus on at-risk learners' : '• Moderate intervention - maintain current support'}\n• ${learnerDirectory.length > 0 ? 'Use personalized outreach with contact info' : 'Consider adding learner directory for personalized outreach'}`
      };
    }

    // Directory/contact info queries
    if (lowerQuery.includes('directory') || lowerQuery.includes('contact') || lowerQuery.includes('slack')) {
      const directoryCount = learnerDirectory.length;
      const atRiskWithContact = analysisResult.atRiskLearners.filter(learner => 
        learnerDirectory.some(dir => dir.email.toLowerCase() === learner.email.toLowerCase())
      ).length;

      return {
        response: `📋 **Contact Information Status**\n\n• Learner directory entries: ${directoryCount}\n• At-risk learners with contact info: ${atRiskWithContact}/${analysisResult.atRiskLearners.length}\n• Coverage: ${analysisResult.atRiskLearners.length > 0 ? Math.round((atRiskWithContact / analysisResult.atRiskLearners.length) * 100) : 0}%\n\n${directoryCount > 0 ? '✅ You can generate personalized Slack outreach scripts!' : '⚠️ Upload learner directory for personalized outreach capabilities.'}`
      };
    }

    // Specific learner count queries
    if (lowerQuery.includes('how many') || lowerQuery.includes('count') || lowerQuery.includes('number of')) {
      const scopeLabel = getScopeLabel();
      const courseContext = currentCourse && analysisResult.courseStats.length === 1 
        ? `\n• Course: ${currentCourse}`
        : `\n• Courses: ${analysisResult.courseStats.map(c => c.courseName).join(', ')}`;

      let specificCount = '';
      if (lowerQuery.includes('completed')) {
        const completed = analysisResult.courseStats.reduce((sum, course) => sum + course.completed, 0);
        specificCount = `\n🎓 **Completed Learners:** ${completed}`;
      } else if (lowerQuery.includes('at risk') || lowerQuery.includes('behind')) {
        specificCount = `\n⚠️ **At-Risk Learners:** ${analysisResult.atRiskLearners.length}`;
      } else if (lowerQuery.includes('not started')) {
        const notStarted = analysisResult.courseStats.reduce((sum, course) => sum + course.notStarted, 0);
        specificCount = `\n🔴 **Not Started:** ${notStarted}`;
      } else if (lowerQuery.includes('in progress')) {
        const inProgress = analysisResult.courseStats.reduce((sum, course) => sum + course.inProgress, 0);
        specificCount = `\n🔵 **In Progress:** ${inProgress}`;
      }

      return {
        response: `${scopeLabel}\n\n📊 **Learner Counts**${courseContext}${specificCount}\n\n📈 **Full Breakdown:**\n• Total learners: ${analysisResult.totalLearners}\n• Completed: ${analysisResult.courseStats.reduce((sum, course) => sum + course.completed, 0)}\n• In Progress: ${analysisResult.courseStats.reduce((sum, course) => sum + course.inProgress, 0)}\n• At Risk: ${analysisResult.atRiskLearners.length}\n• Not Started: ${analysisResult.courseStats.reduce((sum, course) => sum + course.notStarted, 0)}`
      };
    }

    // Percentage queries
    if (lowerQuery.includes('percentage') || lowerQuery.includes('percent') || lowerQuery.includes('%')) {
      const scopeLabel = getScopeLabel();
      const totalLearners = analysisResult.totalLearners;
      const completed = analysisResult.courseStats.reduce((sum, course) => sum + course.completed, 0);
      const inProgress = analysisResult.courseStats.reduce((sum, course) => sum + course.inProgress, 0);
      const atRisk = analysisResult.atRiskLearners.length;
      const notStarted = analysisResult.courseStats.reduce((sum, course) => sum + course.notStarted, 0);

      return {
        response: `${scopeLabel}\n\n📊 **Percentage Breakdown**\n• Completed: ${totalLearners > 0 ? Math.round((completed / totalLearners) * 100) : 0}%\n• In Progress: ${totalLearners > 0 ? Math.round((inProgress / totalLearners) * 100) : 0}%\n• At Risk: ${totalLearners > 0 ? Math.round((atRisk / totalLearners) * 100) : 0}%\n• Not Started: ${totalLearners > 0 ? Math.round((notStarted / totalLearners) * 100) : 0}%\n\nTotal learners: ${totalLearners}`
      };
    }

    // Recommendation queries
    if (lowerQuery.includes('recommend') || lowerQuery.includes('suggest') || lowerQuery.includes('should i') || lowerQuery.includes('what to do')) {
      const atRiskRate = analysisResult.totalLearners > 0 ? Math.round((analysisResult.atRiskLearners.length / analysisResult.totalLearners) * 100) : 0;
      const scopeLabel = getScopeLabel();
      
      let recommendations = [];
      if (atRiskRate > 20) {
        recommendations.push('🚨 **Urgent Action Needed** - High at-risk rate requires immediate intervention');
        recommendations.push('📞 **Schedule 1-on-1 calls** with high-risk learners this week');
        recommendations.push('📋 **Use the personalized Slack scripts** from the Reports section');
      } else if (atRiskRate > 10) {
        recommendations.push('⚠️ **Moderate Intervention** - Monitor at-risk learners closely');
        recommendations.push('💬 **Send check-in messages** to medium and high-risk learners');
      } else {
        recommendations.push('✅ **Maintain Current Support** - Low intervention needs');
        recommendations.push('🎯 **Focus on engagement** to prevent future at-risk situations');
      }

      if (learnerDirectory.length > 0) {
        recommendations.push('📱 **Leverage Contact Info** - You have personalized outreach capabilities');
      } else {
        recommendations.push('📋 **Consider Adding Directory** - Upload learner contact info for personalized outreach');
      }

      return {
        response: `${scopeLabel}\n\n💡 **Personalized Recommendations**\n\n${recommendations.join('\n\n')}\n\n📊 **Based on your data:**\n• At-risk rate: ${atRiskRate}%\n• Total learners needing attention: ${analysisResult.atRiskLearners.length}\n• Contact info available: ${learnerDirectory.length > 0 ? 'Yes' : 'No'}`
      };
    }

    // Default response for unrecognized queries
    return {
      response: `🤔 I'm not sure how to answer that specific question, but I can help you with:\n\n• **Course attention**: "Which course needs the most attention?" or "Which course is performing best?"\n• **Learner counts**: "How many learners are at risk?" or "How many completed?"\n• **Percentages**: "What percentage are completed?"\n• **Completion rates**: "What's the completion rate?"\n• **Recommendations**: "What should I do?" or "What do you recommend?"\n• **Progress trends**: "Show me progress trends"\n• **General insights**: "What are the main insights?"\n\nTry asking a more specific question!`
    };
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const { response, chart } = processQuery(userMessage.content);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response,
        timestamp: new Date(),
        chart
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // 1-2 second delay for realism
  };

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: '1',
        type: 'ai',
        content: `👋 Hi! I'm your AI Analytics Assistant. I can help you analyze trends and insights from your learner data.\n\nTry asking me:\n• "What's the completion rate?"\n• "Which course needs attention?"\n• "Show me progress trends"\n• "Compare course performance"\n• "What are the main insights?"`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  return (
    <div style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px 8px 0 0', 
        borderBottom: '2px solid #e9ecef' 
      }}>
        <h2 style={{ margin: '0', color: '#495057' }}>🤖 AI Insights Assistant</h2>
        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#6c757d' }}>
          Ask me about trends and patterns in your learner data for your course
        </p>
      </div>

      {/* Chat Messages */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '20px', 
        backgroundColor: 'white' 
      }}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              marginBottom: '15px',
              display: 'flex',
              justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div
              style={{
                maxWidth: '70%',
                padding: '12px 16px',
                borderRadius: '18px',
                backgroundColor: message.type === 'user' ? '#007bff' : '#f1f3f4',
                color: message.type === 'user' ? 'white' : '#333'
              }}
            >
              <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
              {message.chart && (
                <div style={{ marginTop: '15px' }}>
                  {message.chart}
                </div>
              )}
              <div style={{ 
                fontSize: '11px', 
                opacity: 0.7, 
                marginTop: '5px',
                textAlign: message.type === 'user' ? 'right' : 'left'
              }}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '15px' }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: '18px',
              backgroundColor: '#f1f3f4',
              color: '#333'
            }}>
              <div>AI is typing...</div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '0 0 8px 8px',
        borderTop: '1px solid #e9ecef'
      }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask me about your learner data trends..."
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '2px solid #e9ecef',
              borderRadius: '25px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            style={{
              padding: '12px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: inputValue.trim() && !isTyping ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;