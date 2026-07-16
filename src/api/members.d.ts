import type { TeamMember } from '../types'

export declare function getMembers(): Promise<TeamMember[]>

export declare function getMember(id: number): Promise<TeamMember>

export declare function createMember(data: {
  name: string
  email: string
  role: string
  color: string
}): Promise<TeamMember>

export declare function updateMember(
  id: number,
  data: {
    name: string
    email: string
    role: string
    color: string
  },
): Promise<TeamMember>

export declare function deleteMember(id: number): Promise<{ message: string }>
