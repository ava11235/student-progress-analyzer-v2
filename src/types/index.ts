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
}