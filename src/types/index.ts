export interface LearnerData {
  email: string;
  courseName: string;
  currentWeek: number;
  currentWeekName: string;
  weekStatus: string;
  currentWeekProgress: string;
  weekPercentage: number;
  lastActivity: string;
  lastCompletedModule: string;
  nextAction: string;
}

export interface LearnerDirectory {
  email: string;
  firstName: string;
  lastName: string;
  slackId: string;
}

export interface AtRiskLearner extends LearnerData {
  weeksBeind: number;
  riskLevel: 'High' | 'Medium' | 'Low';
}

export interface CourseStats {
  courseName: string;
  totalLearners: number;
  inProgress: number;
  completed: number;
  notStarted: number;
  atRisk: number;
}

export interface WeeklyProgress {
  weekNumber: number;
  weekName: string;
  learnersCount: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
}

export interface NextActionStats {
  action: string;
  count: number;
  percentage: number;
}

export interface CourseWeekStats {
  courseName: string;
  currentWeek: number;
  totalWeeks: number;
  weeklyBreakdown: WeeklyProgress[];
}

export interface AnalysisResult {
  totalLearners: number;
  atRiskLearners: AtRiskLearner[];
  courseStats: CourseStats[];
  progressDistribution: {
    range: string;
    count: number;
  }[];
  riskDistribution: {
    name: string;
    count: number;
    percentage: number;
  }[];
  weeklyProgressStats: WeeklyProgress[];
  nextActionStats: NextActionStats[];
  courseWeekStats: CourseWeekStats[];
  offTrackLearners: LearnerData[];
  isGracePeriod: boolean;
  currentWeek: number;
}