import { Player } from '@/types';

const API_URL = 'https://6768cb80cbf3d7cefd38b097.mockapi.io/api/v1';

export const playerService = {
  async getAllPlayers(): Promise<Player[]> {
    try {
      const response = await fetch(`${API_URL}/jugadores`);
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    } catch (error) {
      console.error('Error fetching players:', error);
      throw error;
    }
  }
};