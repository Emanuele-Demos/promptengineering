export type GoalType = 'daily' | 'weekly'
export type GoalProgressStatus = 'in_progress' | 'reached'
export type GoalHistoryStatus = 'reached' | 'not_reached'

export interface GoalWithProgressDto {
  id: string
  userId: string
  type: GoalType
  target: number
  periodStart: string
  periodEnd: string
  completedTasks: number
  completionPercentage: number
  status: GoalProgressStatus
  createdAt: string
  updatedAt: string
}

export interface GoalHistoryDto {
  id: string
  goalId: string
  userId: string
  type: GoalType
  target: number
  completedTasks: number
  completionPercentage: number
  status: GoalHistoryStatus
  periodStart: string
  periodEnd: string
  createdAt: string
}

export function getGoals(): Promise<GoalWithProgressDto[]>
export function getGoalHistory(type?: GoalType): Promise<GoalHistoryDto[]>
export function createGoal(input: { type: GoalType; target: number }): Promise<GoalWithProgressDto>
export function updateGoal(id: string, input: { target: number }): Promise<GoalWithProgressDto>
export function deleteGoal(id: string): Promise<{ message: string }>
