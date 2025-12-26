// Test setup file for vitest
import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock PeerJS since it requires browser APIs
vi.mock('peerjs', () => ({
  Peer: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    connect: vi.fn(),
    destroy: vi.fn(),
  })),
}))

// Mock Web Audio API
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    createOscillator: vi.fn(() => ({
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      frequency: { value: 0 },
    })),
    createGain: vi.fn(() => ({
      connect: vi.fn(),
      gain: {
        value: 0,
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
    })),
    destination: {},
    currentTime: 0,
  })),
})

// Mock navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: vi.fn(),
})