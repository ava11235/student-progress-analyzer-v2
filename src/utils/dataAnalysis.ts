import { LearnerData, AtRiskLearner, CourseStats, AnalysisResult, WeeklyProgress, NextActionStats, CourseWeekStats } from '../types';

export const analyzeLearnerData = async (data: LearnerData[], currentWeek: number): Promise<AnalysisResult> => {
  // Get unique learners (deduplicate by email)
  const uniqueEmails = new Set(data.map(learner => learner.email));
  const uniqueLearnerCount = uniqueEmails.size;
  
  // Use the provided current week for analysis
  const currentAnalysisWeek = currentWeek;
  
  // Removed date-based activity calculation - using week-based only

  // Identify off-track learners using Skill Builder methodology
  // Step 1: Filter learners who are behind the current week
  // Step 2: Exclude learners whose Next Action is "Move to Week X" (they're ready to advance)
  const offTrackLearners = data.filter(learner => {
    // Only include learners who are behind the current analysis week
    const isBehindCurrentWeek = learner.currentWeek < currentAnalysisWeek;
    if (!isBehindCurrentWeek) return false;
    
    // Exclude learners who are ready to move to the next week
    const nextAction = learner.nextAction.toLowerCase();
    const isReadyToAdvance = nextAction.includes('move to week') || nextAction.includes('move to next');
    
    return !isReadyToAdvance;
  });

  // Calculate at-risk learners: Focus on "saveable" learners 1-3 weeks behind current week
  const atRiskLearners: AtRiskLearner[] = data
    .filter(learner => {
      // Target learners who are 1-3 weeks behind (can still be helped)
      const weeksBehind = currentAnalysisWeek - learner.currentWeek;
      return weeksBehind >= 1 && weeksBehind <= 3;
    })
    .map(learner => {
      const weeksBehind = Math.max(0, currentAnalysisWeek - learner.currentWeek);
      
      // Determine risk level for actionable intervention
      let riskLevel: 'High' | 'Medium' | 'Low' = 'Low';
      
      if (weeksBehind === 3) {
        riskLevel = 'High';      // 3 weeks behind - urgent intervention needed
      } else if (weeksBehind === 2) {
        riskLevel = 'Medium';    // 2 weeks behind - moderate intervention
      } else if (weeksBehind === 1) {
        riskLevel = 'Low';       // 1 week behind - gentle nudge needed
      }
      
      return {
        ...learner,
        weeksBeind: weeksBehind,
        riskLevel
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
  // We'll categorize learners into 4 distinct categories based on their current status
  const statusCounts = {
    completed: 0,
    inProgress: 0,
    atRisk: 0,
    notStarted: 0
  };

  // Count unique learners by their primary status
  Array.from(uniqueLearnersMap.values()).forEach(learner => {
    const status = learner.weekStatus.toLowerCase();
    const isAtRisk = atRiskLearners.some(atRisk => atRisk.email === learner.email);
    
    if (status.includes('completed')) {
      statusCounts.completed++;
    } else if (status.includes('not started')) {
      statusCounts.notStarted++;
    } else if (status.includes('progress')) {
      // For "In Progress" learners, check if they're at risk
      if (isAtRisk) {
        statusCounts.atRisk++;
      } else {
        statusCounts.inProgress++;
      }
    } else {
      // Default case for unclear statuses - treat as in progress
      if (isAtRisk) {
        statusCounts.atRisk++;
      } else {
        statusCounts.inProgress++;
      }
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

  // Calculate weekly progress statistics
  const weekNumbers = Array.from(new Set(data.map(learner => learner.currentWeek))).sort((a, b) => a - b);
  const weeklyProgressStats = weekNumbers.map(weekNum => {
    const weekLearners = data.filter(learner => learner.currentWeek === weekNum);
    const weekName = weekLearners[0]?.currentWeekName || `Week ${weekNum}`;
    
    return {
      weekNumber: weekNum,
      weekName,
      learnersCount: weekLearners.length,
      completedCount: weekLearners.filter(l => l.weekStatus.toLowerCase().includes('completed')).length,
      inProgressCount: weekLearners.filter(l => l.weekStatus.toLowerCase().includes('progress')).length,
      notStartedCount: weekLearners.filter(l => l.weekStatus.toLowerCase().includes('not started')).length
    };
  });

  // Calculate Next Action statistics
  const nextActionMap = new Map<string, number>();
  data.forEach(learner => {
    const action = learner.nextAction.trim();
    if (action) {
      nextActionMap.set(action, (nextActionMap.get(action) || 0) + 1);
    }
  });

  const nextActionStats = Array.from(nextActionMap.entries())
    .map(([action, count]) => ({
      action,
      count,
      percentage: Math.round((count / data.length) * 100)
    }))
    .sort((a, b) => b.count - a.count);

  // Calculate course week statistics
  const courseWeekStats = courseStats.map(course => {
    const courseLearners = data.filter(learner => learner.courseName === course.courseName);
    const courseWeeks = Array.from(new Set(courseLearners.map(l => l.currentWeek))).sort((a, b) => a - b);
    
    // Determine total weeks (11 for most courses, 10 for Developer Fundamentals)
    const totalWeeks = course.courseName.toLowerCase().includes('developer fundamentals') ? 10 : 11;
    const currentWeek = Math.max(...courseWeeks);
    
    const weeklyBreakdown = courseWeeks.map(weekNum => {
      const weekLearners = courseLearners.filter(learner => learner.currentWeek === weekNum);
      const weekName = weekLearners[0]?.currentWeekName || `Week ${weekNum}`;
      
      return {
        weekNumber: weekNum,
        weekName,
        learnersCount: weekLearners.length,
        completedCount: weekLearners.filter(l => l.weekStatus.toLowerCase().includes('completed')).length,
        inProgressCount: weekLearners.filter(l => l.weekStatus.toLowerCase().includes('progress')).length,
        notStartedCount: weekLearners.filter(l => l.weekStatus.toLowerCase().includes('not started')).length
      };
    });

    return {
      courseName: course.courseName,
      currentWeek,
      totalWeeks,
      weeklyBreakdown
    };
  });

  return {
    totalLearners: uniqueLearnerCount,
    atRiskLearners,
    courseStats,
    progressDistribution,
    riskDistribution,
    weeklyProgressStats,
    nextActionStats,
    courseWeekStats,
    offTrackLearners
  };
};