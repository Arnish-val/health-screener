import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useApi from '../../hooks/useApi';

describe('useApi', () => {
  it('starts with default state', () => {
    const mockFn = async () => 'result';
    const { result } = renderHook(() => useApi(mockFn));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets data on success', async () => {
    const mockFn = async () => ({ prediction: 'Cold' });
    const { result } = renderHook(() => useApi(mockFn));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.data).toEqual({ prediction: 'Cold' });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets error on failure', async () => {
    const mockFn = async () => {
      throw new Error('Network error');
    };
    const { result } = renderHook(() => useApi(mockFn));

    await act(async () => {
      try {
        await result.current.execute();
      } catch {
        // Expected
      }
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('resets state', async () => {
    const mockFn = async () => ({ data: 'test' });
    const { result } = renderHook(() => useApi(mockFn));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.data).not.toBeNull();

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
