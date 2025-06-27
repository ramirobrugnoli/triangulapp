import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ScoreBoard } from '@/components/game/ScoreBoard';

describe('ScoreBoard Component', () => {
  const defaultProps = {
    teamA: 'Equipo 1',
    teamB: 'Equipo 2',
    scoreTeamA: 0,
    scoreTeamB: 0,
    onGoalTeamA: jest.fn(),
    onGoalTeamB: jest.fn(),
  };

  it('should render score board with provided props', () => {
    const { container } = render(<ScoreBoard {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('should display team names and scores', () => {
    const props = {
      ...defaultProps,
      scoreTeamA: 2,
      scoreTeamB: 1,
    };
    
    const { getByText } = render(<ScoreBoard {...props} />);
    expect(getByText('Equipo 1')).toBeInTheDocument();
    expect(getByText('Equipo 2')).toBeInTheDocument();
    expect(getByText('2')).toBeInTheDocument();
    expect(getByText('1')).toBeInTheDocument();
  });
}); 