import { LearnerData, AtRiskLearner, CourseStats, AnalysisResult } from '../types';

export const analyzeLearnerData = async (data: LearnerData[]): Promise<AnalysisResult> => {
  // Get unique learners (deduplicate by email)
  const uniqueEmails = new Set(data.map(learner => learner.email));
  const uniqueLearnerCount = uniqueEmails.size;
  
  // Helper function to calculate weeks since last activity
  const getWeeksSinceLastActivity = (lastActivity: string): number => {
    const currentDate = new Date();
    
    // Try to parse different date formats from the lastActivity string
    // Common formats: "10-Jul-25", "July 10, 2025", "2025-07-10", etc.
    let activityDate: Date | null = null;
    
    // Try parsing "10-Jul-25" format
    const ddMmmYyMatch = lastActivity.match(/(\d{1,2})-([A-Za-z]{3})-(\d{2})/);
    if (ddMmmYyMatch) {
      const [, day, month, year] = ddMmmYyMatch;
      const monthMap: { [key: string]: number } = {
        'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
      };
      const fullYear = parseInt(year) + 2000; // Convert 25 to 2025
      activityDate = new Date(fullYear, monthMap[month.toLowerCase()], parseInt(day));
    }
    
    // If we couldn't parse the date, assume it's recent (0 weeks ago)
    if (!activityDate || isNaN(activityDate.getTime())) {
      return 0;
    }
    
    // Calculate weeks difference
    const timeDiff = currentDate.getTime() - activityDate.getTime();
    const weeksDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 7));
    
    return Math.max(0, weeksDiff);
  };

  // Calculate at-risk learners: In Progress learners with last activity 3+ weeks ago
  const atRiskLearners: AtRiskLearner[] = data
    .filter(learner => {
      // Only consider "In Progress" learners
      const isInProgress = learner.weekStatus.toLowerCase().includes('progress');
      if (!isInProgress) return false;
      
      // Check if last activity was 3+ weeks ago
      const weeksSinceActivity = getWeeksSinceLastActivity(learner.lastActivity);
      return weeksSinceActivity >= 3;
    })
    .map(learner => {
      const weeksSinceActivity = getWeeksSinceLastActivity(learner.lastActivity);
      
      return {
        ...learner,
        weeksBeind: weeksSinceActivity,
        riskLevel: weeksSinceActivity >= 6 ? 'High' as const : 'Medium' as const
      };
    })
    .sort((a, b) => b.weeksBeind - a.weeksBeind);

  // Calculate course statistics with unique learners per course
  const courseMap = new Map<string, CourseStats>();
  
  // Group learners by course and email to avoid duplicates
  const courseLearnersMap = new Map<string, Map<string, LearnerData>>();
  
  data.forEach(learner => {
    const courseName = learner.courseName;
    
    if (!courseLearnersMap.has(courseName)) {
      courseLearnersMap.set(courseName, new Map());
    }
    
    // Use email as key to ensure uniqueness per course
    courseLearnersMap.get(courseName)!.set(learner.email, learner);
  });
  
  // Calculate stats for each course
  courseLearnersMap.forEach((learners, courseName) => {
    const stats: CourseStats = {
      courseName,
      totalLearners: learners.size,
      inProgress: 0,
      completed: 0,
      notStarted: 0,
      atRisk: 0
    };
    
    learners.forEach(learner => {
      // Categorize learner status
      if (learner.weekStatus.toLowerCase().includes('completed')) {
        stats.completed++;
      } else if (learner.weekStatus.toLowerCase().includes('progress')) {
        stats.inProgress++;
      } else if (learner.weekStatus.toLowerCase().includes('not started')) {
        stats.notStarted++;
      } else {
        stats.inProgress++; // Default to in progress
      }
      
      // Check if at risk
      const isAtRisk = atRiskLearners.some(atRisk => 
        atRisk.email === learner.email && atRisk.courseName === learner.courseName
      );
      if (isAtRisk) {
        stats.atRisk++;
      }
    });
    
    courseMap.set(courseName, stats);
  });

  const courseStats = Array.from(courseMap.values());

  // Calculate progress distribution using unique learners
  const uniqueLearnersMap = new Map<string, LearnerData>();
  data.forEach(learner => {
    uniqueLearnersMap.set(learner.email, learner);
  });
  
  const progressRanges = [
    { range: '0-20%', min: 0, max: 20 },
    { range: '21-40%', min: 21, max: 40 },
    { range: '41-60%', min: 41, max: 60 },
    { range: '61-80%', min: 61, max: 80 },
    { range: '81-100%', min: 81, max: 100 }
  ];

  const progressDistribution = progressRanges.map(range => ({
    range: range.range,
    count: Array.from(uniqueLearnersMap.values()).filter(learner => 
      learner.weekPercentage >= range.min && learner.weekPercentage <= range.max
    ).length
  }));



  // Calculate status distribution using unique learners
  const uniqueAtRiskEmails = new Set(atRiskLearners.map(learner => learner.email));
  const statusCounts = {
    inProgress: 0,
    completed: 0,
    notStarted: 0,
    atRisk: uniqueAtRiskEmails.size
  };

  // Count unique learners by Week Status column
  Array.from(uniqueLearnersMap.values()).forEach(learner => {
    const isAtRisk = uniqueAtRiskEmails.has(learner.email);
    
    if (isAtRisk) {
      // At-risk learners are counted separately
      return;
    }
    
    const status = learner.weekStatus.toLowerCase();
    if (status.includes('completed')) {
      statusCounts.completed++;
    } else if (status.includes('not started')) {
      statusCounts.notStarted++;
    } else if (status.includes('progress')) {
      statusCounts.inProgress++;
    } else {
      // Default case for unclear statuses
      statusCounts.inProgress++;
    }
  });

  const riskDistribution = [
    {
      name: 'In Progress',
      count: statusCounts.inProgress,
      percentage: Math.round((statusCounts.inProgress / uniqueLearnerCount) * 100)
    },
    {
      name: 'Completed',
      count: statusCounts.completed,
      percentage: Math.round((statusCounts.completed / uniqueLearnerCount) * 100)
    },
    {
      name: 'At Risk',
      count: statusCounts.atRisk,
      percentage: Math.round((statusCounts.atRisk / uniqueLearnerCount) * 100)
    },
    {
      name: 'Not Started',
      count: statusCounts.notStarted,
      percentage: Math.round((statusCounts.notStarted / uniqueLearnerCount) * 100)
    }
  ].filter(item => item.count > 0); // Only show categories with learners

  return {
    totalLearners: uniqueLearnerCount,
    atRiskLearners,
    courseStats,
    progressDistribution,
    riskDistribution
  };
};