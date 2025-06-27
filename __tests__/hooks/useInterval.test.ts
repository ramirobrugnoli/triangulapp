import { renderHook } from '@testing-library/react';
import useInterval from '@/hooks/useInterval';

describe('useInterval Hook', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should call callback on interval when delay is provided', () => {
    const callback = jest.fn();
    const delay = 1000;

    renderHook(() => useInterval(callback, delay));

    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(delay);
    expect(callback).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(delay);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('should not call callback when delay is null', () => {
    const callback = jest.fn();

    renderHook(() => useInterval(callback, null));

    jest.advanceTimersByTime(5000);
    expect(callback).not.toHaveBeenCalled();
  });

  it('should clear interval on unmount', () => {
    const callback = jest.fn();
    const delay = 1000;

    const { unmount } = renderHook(() => useInterval(callback, delay));

    jest.advanceTimersByTime(delay);
    expect(callback).toHaveBeenCalledTimes(1);

    unmount();

    jest.advanceTimersByTime(delay * 3);
    expect(callback).toHaveBeenCalledTimes(1); // Should not be called after unmount
  });

  it('should update interval when delay changes', () => {
    const callback = jest.fn();
    let delay = 1000;

    const { rerender } = renderHook(() => useInterval(callback, delay));

    jest.advanceTimersByTime(delay);
    expect(callback).toHaveBeenCalledTimes(1);

    // Change delay
    delay = 500;
    rerender();

    jest.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(2);
  });
}); 