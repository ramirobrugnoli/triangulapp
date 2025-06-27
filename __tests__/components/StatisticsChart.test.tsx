import React from 'react';
import { render } from '@testing-library/react';
import { StatisticsChart } from '@/app/graficos/components/StatisticsChart';
import { ApexOptions } from 'apexcharts';

// Mock next/dynamic
jest.mock('next/dynamic', () => {
  return (importFunc: () => Promise<any>, options?: { ssr?: boolean }) => {
    // Return a mock component that simulates the dynamically imported Chart
    return function MockDynamicChart(props: any) {
      return (
        <div 
          data-testid="mock-chart"
          data-options={JSON.stringify(props.options)}
          data-series={JSON.stringify(props.series)}
          data-type={props.type}
          data-height={props.height}
        />
      );
    };
  };
});

// Mock react-apexcharts (in case it's directly imported somewhere)
jest.mock('react-apexcharts', () => {
  return function MockChart(props: any) {
    return (
      <div 
        data-testid="mock-chart"
        data-options={JSON.stringify(props.options)}
        data-series={JSON.stringify(props.series)}
        data-type={props.type}
        data-height={props.height}
      />
    );
  };
});

describe('StatisticsChart', () => {
  const mockOptions: ApexOptions = {
    chart: {
      id: 'test-chart',
    },
    xaxis: {
      categories: ['Player 1', 'Player 2', 'Player 3'],
    },
  };

  const mockSeries = [
    {
      name: 'Goals',
      data: [10, 15, 8],
    },
  ];

  it('renders with bar chart type', () => {
    const { getByTestId } = render(
      <StatisticsChart 
        options={mockOptions}
        series={mockSeries}
        type="bar"
      />
    );
    
    const chart = getByTestId('mock-chart');
    expect(chart).toBeInTheDocument();
    expect(chart).toHaveAttribute('data-type', 'bar');
    expect(chart).toHaveAttribute('data-height', '100%');
  });

  it('renders with line chart type', () => {
    const { getByTestId } = render(
      <StatisticsChart 
        options={mockOptions}
        series={mockSeries}
        type="line"
      />
    );
    
    const chart = getByTestId('mock-chart');
    expect(chart).toHaveAttribute('data-type', 'line');
  });

  it('renders with area chart type', () => {
    const { getByTestId } = render(
      <StatisticsChart 
        options={mockOptions}
        series={mockSeries}
        type="area"
      />
    );
    
    const chart = getByTestId('mock-chart');
    expect(chart).toHaveAttribute('data-type', 'area');
  });

  it('passes options correctly to chart', () => {
    const { getByTestId } = render(
      <StatisticsChart 
        options={mockOptions}
        series={mockSeries}
        type="bar"
      />
    );
    
    const chart = getByTestId('mock-chart');
    const passedOptions = JSON.parse(chart.getAttribute('data-options') || '{}');
    expect(passedOptions.chart.id).toBe('test-chart');
    expect(passedOptions.xaxis.categories).toEqual(['Player 1', 'Player 2', 'Player 3']);
  });

  it('passes series correctly to chart', () => {
    const { getByTestId } = render(
      <StatisticsChart 
        options={mockOptions}
        series={mockSeries}
        type="bar"
      />
    );
    
    const chart = getByTestId('mock-chart');
    const passedSeries = JSON.parse(chart.getAttribute('data-series') || '[]');
    expect(passedSeries[0].name).toBe('Goals');
    expect(passedSeries[0].data).toEqual([10, 15, 8]);
  });

  it('handles empty series', () => {
    const { getByTestId } = render(
      <StatisticsChart 
        options={mockOptions}
        series={[]}
        type="bar"
      />
    );
    
    const chart = getByTestId('mock-chart');
    const passedSeries = JSON.parse(chart.getAttribute('data-series') || '[]');
    expect(passedSeries).toEqual([]);
  });

  it('handles complex options', () => {
    const complexOptions: ApexOptions = {
      chart: {
        id: 'complex-chart',
        type: 'bar',
        height: 350,
      },
      title: {
        text: 'Player Statistics',
      },
      colors: ['#FF5733', '#33FF57'],
      dataLabels: {
        enabled: false,
      },
    };

    const { getByTestId } = render(
      <StatisticsChart 
        options={complexOptions}
        series={mockSeries}
        type="bar"
      />
    );
    
    const chart = getByTestId('mock-chart');
    const passedOptions = JSON.parse(chart.getAttribute('data-options') || '{}');
    expect(passedOptions.title.text).toBe('Player Statistics');
    expect(passedOptions.colors).toEqual(['#FF5733', '#33FF57']);
    expect(passedOptions.dataLabels.enabled).toBe(false);
  });
}); 