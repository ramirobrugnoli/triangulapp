import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// NextResponse mock will be handled per test file to avoid conflicts

// Mock global objects for API routes
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Web API globals that Next.js expects
global.Request = class Request {
  constructor(input, init) {
    this.url = input;
    this.method = init?.method || 'GET';
    this.headers = new Headers(init?.headers);
    this.body = init?.body;
  }
  
  async json() {
    return JSON.parse(this.body);
  }
  
  async text() {
    return this.body;
  }
};

global.Response = class Response {
  constructor(body, init) {
    this.body = body;
    this.status = init?.status || 200;
    this.statusText = init?.statusText || 'OK';
    this.headers = new Headers(init?.headers);
  }
  
  async json() {
    return JSON.parse(this.body);
  }
  
  async text() {
    return this.body;
  }
};

global.Headers = class Headers {
  constructor(init) {
    this.map = new Map();
    if (init) {
      if (Array.isArray(init)) {
        for (const [key, value] of init) {
          this.set(key, value);
        }
      } else if (typeof init === 'object') {
        for (const [key, value] of Object.entries(init)) {
          this.set(key, value);
        }
      }
    }
  }
  
  get(name) {
    return this.map.get(name.toLowerCase());
  }
  
  set(name, value) {
    this.map.set(name.toLowerCase(), value);
  }
  
  has(name) {
    return this.map.has(name.toLowerCase());
  }
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock window.matchMedia (only in jsdom environment)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

global.fetch = jest.fn();

// Only mock HTMLMediaElement in jsdom environment
if (typeof global.HTMLMediaElement !== 'undefined') {
  global.HTMLMediaElement.prototype.play = jest.fn();
  global.HTMLMediaElement.prototype.pause = jest.fn();
  global.HTMLMediaElement.prototype.load = jest.fn();
}

// Only set up DOM-related mocks in jsdom environment
if (typeof window !== 'undefined') {
  Object.defineProperty(global, 'localStorage', {
    value: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
    writable: true,
  });

  Object.defineProperty(global, 'sessionStorage', {
    value: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
    writable: true,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  fetch.mockClear();
  
  // Only clear localStorage mocks if in jsdom environment
  if (typeof window !== 'undefined' && global.localStorage) {
    localStorage.getItem.mockClear();
    localStorage.setItem.mockClear();
    localStorage.removeItem.mockClear();
    localStorage.clear.mockClear();
  }
});

// Suppress console errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Warning: validateDOMNesting'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
}); 