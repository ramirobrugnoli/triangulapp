import { getColorByTeam } from '@/lib/helpers/helpers';

describe('Helper Functions', () => {
  describe('getColorByTeam', () => {
    it('should return correct color for Equipo 1', () => {
      expect(getColorByTeam('Equipo 1')).toBe('Amarillo');
    });

    it('should return correct color for Equipo 2', () => {
      expect(getColorByTeam('Equipo 2')).toBe('Rosa');
    });

    it('should return correct color for Equipo 3', () => {
      expect(getColorByTeam('Equipo 3')).toBe('Negro');
    });

    it('should return empty string for unknown teams', () => {
      expect(getColorByTeam('Unknown Team' as any)).toBe('');
    });

    it('should handle empty string', () => {
      expect(getColorByTeam('' as any)).toBe('');
    });
  });
}); 