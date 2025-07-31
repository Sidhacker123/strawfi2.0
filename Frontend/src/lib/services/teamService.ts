import { config } from '@/lib/config';

const API_BASE_URL = config.api.baseUrl;

export interface TeamLoginRequest {
  team_id: string;
  password: string;
}

export interface TeamCreateRequest {
  team_id: string;
  team_name: string;
  password: string;
}

export interface TeamLoginResponse {
  token: string;
  team_id: string;
  team_name: string;
}

export interface TeamCreateResponse {
  success: boolean;
  team_id: string;
  team_name: string;
}

export const teamService = {
  async login(credentials: TeamLoginRequest): Promise<TeamLoginResponse> {
    const response = await fetch(`${API_BASE_URL}/api/team-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    return response.json();
  },

  async createTeam(teamData: TeamCreateRequest): Promise<TeamCreateResponse> {
    const response = await fetch(`${API_BASE_URL}/api/team-create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(teamData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create team');
    }

    return response.json();
  },

  async checkTeamsExist(): Promise<{ exists: boolean }> {
    const response = await fetch(`${API_BASE_URL}/api/teams-exist`);
    
    if (!response.ok) {
      throw new Error('Failed to check if teams exist');
    }

    return response.json();
  },
}; 