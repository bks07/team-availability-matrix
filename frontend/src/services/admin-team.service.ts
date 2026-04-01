import { httpClient } from '../lib/http.client';
import type { AdminTeam, TeamMember } from '../lib/api.models';

export const adminTeamService = {
  listTeams: (): Promise<AdminTeam[]> =>
    httpClient.get('/admin/teams'),

  createTeam: (data: { name: string; description?: string }): Promise<AdminTeam> =>
    httpClient.post('/admin/teams', data),

  updateTeam: (id: number, data: { name: string; description?: string }): Promise<AdminTeam> =>
    httpClient.put(`/admin/teams/${id}`, data),

  deleteTeam: (id: number): Promise<void> =>
    httpClient.delete(`/admin/teams/${id}`),

  listMembers: (teamId: number): Promise<TeamMember[]> =>
    httpClient.get(`/admin/teams/${teamId}/members`),

  assignUser: (teamId: number, userId: number): Promise<TeamMember> =>
    httpClient.post(`/admin/teams/${teamId}/members`, { userId }),

  removeUser: (teamId: number, userId: number): Promise<void> =>
    httpClient.delete(`/admin/teams/${teamId}/members/${userId}`),
};
