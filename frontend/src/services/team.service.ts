import { httpClient } from '../lib/http.client';
import {
  Team,
  TeamDetail,
  TeamInvitation,
  CreateTeamRequest,
  UpdateTeamRequest,
  UserSearchResult,
} from '../lib/api.models';

export const teamService = {
  // Team CRUD
  getMyTeams: (): Promise<Team[]> =>
    httpClient.get('/teams'),

  getTeamDetail: (id: number): Promise<TeamDetail> =>
    httpClient.get(`/teams/${id}`),

  createTeam: (data: CreateTeamRequest): Promise<Team> =>
    httpClient.post('/teams', data),

  updateTeam: (id: number, data: UpdateTeamRequest): Promise<Team> =>
    httpClient.put(`/teams/${id}`, data),

  deleteTeam: (id: number): Promise<void> =>
    httpClient.delete(`/teams/${id}`),

  // Invitations
  inviteToTeam: (teamId: number, userId: number): Promise<TeamInvitation> =>
    httpClient.post(`/teams/${teamId}/invitations`, { userId }),

  getMyInvitations: (): Promise<TeamInvitation[]> =>
    httpClient.get('/teams/invitations'),

  acceptInvitation: (id: number): Promise<TeamInvitation> =>
    httpClient.post(`/teams/invitations/${id}/accept`),

  rejectInvitation: (id: number): Promise<TeamInvitation> =>
    httpClient.post(`/teams/invitations/${id}/reject`),

  cancelInvitation: (id: number): Promise<void> =>
    httpClient.delete(`/teams/invitations/${id}`),

  // Membership
  updateMemberRole: (teamId: number, userId: number, role: string): Promise<void> =>
    httpClient.put(`/teams/${teamId}/members/${userId}/role`, { role }),

  removeMember: (teamId: number, userId: number): Promise<void> =>
    httpClient.delete(`/teams/${teamId}/members/${userId}`),

  leaveTeam: (teamId: number): Promise<void> =>
    httpClient.post(`/teams/${teamId}/leave`),

  transferOwnership: (teamId: number, newOwnerId: number): Promise<void> =>
    httpClient.post(`/teams/${teamId}/transfer-ownership`, { newOwnerId }),

  // User search (for invite modal)
  // Favorites
  toggleFavorite: (teamId: number): Promise<{ isFavorite: boolean }> =>
    httpClient.put(`/teams/${teamId}/favorite`),

  searchUsers: (query: string): Promise<UserSearchResult[]> =>
    httpClient.get('/users/search', { q: query }),
};
