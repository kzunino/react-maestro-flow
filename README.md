# react-maestro

Stateful, branching workflow orchestration for React.

Build complex, multi-step user flows with automatic state management, URL synchronization, and conditional navigation.

## Features

- **Graph-based navigation** - Define your flow as a graph of nodes with conditional branching
- **Automatic state management** - State persists across pages in session storage
- **URL synchronization** - Works with query params or path-based routing (Next.js, Remix, etc.)
- **Conditional routing** - Navigate based on user state or API responses
- **Skip pages** - Automatically skip pages based on conditions
- **Browser history** - Proper back/forward navigation with skipped pages handled correctly
- **TypeScript** - Full type safety with inferred state types

## Installation

```bash
npm install react-maestro
```

## Quick Start

```tsx
import {Flow, initializeFlow, useFlow} from 'react-maestro';

// 1. Define your pages as nodes
const nodes = [
  {
    currentPage: 'step1',
    nextPage: 'step2',
  },
  {
    currentPage: 'step2',
    nextPage: (state) => {
      // State is keyed by page: state.step2.userType, state.step1.name, etc.
      const step2 = state.step2 as {userType?: string} | undefined;
      return step2?.userType === 'premium' ? 'premiumStep' : 'standardStep';
    },
  },
  {
    currentPage: 'premiumStep',
    nextPage: 'complete',
  },
  {
    currentPage: 'standardStep',
    nextPage: 'complete',
  },
];

// 2. Create the graph
const graph = initializeFlow(nodes, 'step1');

// 3. Define component loaders
const componentLoaders = new Map([
  ['step1', () => import('./pages/Step1')],
  ['step2', () => import('./pages/Step2')],
  ['premiumStep', () => import('./pages/PremiumStep')],
  ['standardStep', () => import('./pages/StandardStep')],
  ['complete', () => import('./pages/Complete')],
]);

// 4. Use the Flow component
function App() {
  return (
    <Flow
      graph={graph}
      config={{
        componentLoaders,
      }}
    />
  );
}

// 5. In your page components, use the hook
function Step1() {
  const {stateKey, goToNext, hasNext} = useFlow();
  const [name, setName] = stateKey<string>('name');

  return (
    <div>
      <input
        value={name || ''}
        onChange={(e) => setName(e.target.value)}
        placeholder='Enter your name'
      />
      <button onClick={goToNext} disabled={!hasNext}>
        Next
      </button>
    </div>
  );
}
```

## Configuration

### Flow Component Props

```tsx
<Flow
  graph={FlowGraph}
  config={{
    // Optional: URL params adapter (defaults to query params)
    urlParamsAdapter?: UrlParamsAdapter,

    // Optional: URL param names (defaults shown)
    pageParamName?: string, // default: "page"
    uuidParamName?: string, // default: "id"

    // Optional: Callback when page changes (page, previousPage, state)
    onPageChange?: (page: string | null, previousPage: string | null, state: FlowState) => void,

    // Optional: Use internal state (session storage). Default: true.
    // Set to false for navigation-only usage (state in memory, lost on refresh).
    enableState?: boolean,

    // Required: Map of page IDs to component loaders
    componentLoaders: Map<string, ComponentLoader>,
  }}
/>
```

#### `enableState` (default: `true`)

Controls whether the flow uses the internal state system (session storage).

- **`true` (default)**: State is persisted in session storage. Users can refresh or revisit via URL and resume. The "expired" flow runs when the UUID has no stored state.
- **`false`**: State is kept in memory only (lost on refresh). No session storage, no expired check. Use when you only need navigation (goToNext, goToPrevious, goToPage, skipToPage, etc.) and manage state yourself (e.g. React state, URL, or external store).

```tsx
// Navigation only, no persisted state
<Flow graph={graph} config={{componentLoaders, enableState: false}} />
```

### FlowNode Properties

Each node in your graph can have:

```tsx
{
  currentPage: string; // Required: Unique page identifier

  nextPage?: string | ((state: FlowState) => string | null);
  // Optional: Next page(s). Can be:
  // - A string: "nextPageId"
  // - A function: (state) => state.condition ? "pageA" : "pageB"

  previousPageFallback?: string;
  // Optional: Fallback when resolving previous non-skipped pages
  // (Back navigation uses browser history by default)

  shouldSkip?: (state: FlowState) => boolean;
  // Optional: Skip this page if function returns true
  // Skipped pages are automatically bypassed
}
```

## useFlow Hook

The `useFlow` hook provides access to all flow functionality:

```tsx
const {
  // Current state
  currentPage: string | null,
  state: FlowState, // Accumulated state from all pages

  // Navigation
  goToNext: () => void,
  goToPrevious: () => void,
  goToPage: (page: string) => void, // Preserves history
  skipToPage: (page: string) => void, // Replaces history

  // State management
  stateKey: <T>(key: string) => [T | undefined, (value: T) => void],
  updateState: (key: string, value: unknown) => void,
  updateStateBatch: (updates: Record<string, unknown>) => void,
  getPageState: (page: string) => FlowState,

  // Navigation info
  hasNext: boolean,

  // Utilities
  getCurrentNode: () => FlowNode | undefined,
  getNode: (page: string) => FlowNode | undefined,
  skipCurrentPage: () => void,
  completeFlow: () => void,

  // URL params
  getUrlParam: (key: string) => string | null,
  getAllUrlParams: () => Record<string, string>,
  urlParams: Record<string, string>,
} = useFlow();
```

### State Management

#### Using `stateKey` (Recommended)

```tsx
const [name, setName] = stateKey<string>('name');
const [email, setEmail] = stateKey<string>('email');

// Use like useState
<input value={name || ''} onChange={(e) => setName(e.target.value)} />;
```

#### Using `updateState` / `updateStateBatch`

```tsx
updateState('name', 'John');
updateStateBatch({name: 'John', email: 'john@example.com'});
```

#### Getting State

```tsx
// Get all accumulated state
const allState = state; // { name: "John", email: "...", ... }

// Get state for a specific page
const step1State = getPageState('step1');
```

### Navigation

#### Basic Navigation

```tsx
// Go to next page
goToNext();

// Go to previous page (uses browser history)
goToPrevious();

// Check if navigation is possible
if (hasNext) {
  goToNext();
}
```

#### Jumping to Specific Pages

```tsx
// Navigate to any page (preserves history - user can go back)
goToPage('step5');

// Skip to a page (replaces history - no back button)
// Useful after API calls
const result = await checkEligibility();
if (result.eligible) {
  skipToPage('checkout');
} else {
  skipToPage('notEligible');
}
```

#### Conditional Skipping

```tsx
// Skip current page programmatically (e.g., after async check)
useEffect(() => {
  checkStatus().then((status) => {
    if (status.shouldSkip) {
      skipCurrentPage();
    }
  });
}, []);
```

### URL Parameters

Access arbitrary URL parameters (works with query params or path params):

```tsx
// Get a single param
const userId = getUrlParam('userId');

// Get all params
const allParams = getAllUrlParams(); // { page: "step1", id: "abc123", userId: "456" }

// Reactive params (updates on navigation)
const {userId, type} = urlParams;
```

## Advanced Usage

### Path-Based URLs (Next.js, Remix, etc.)

```tsx
import {createPathParamsAdapter, Flow} from 'react-maestro';

// For Next.js App Router
const adapter = createPathParamsAdapterFromProps(
  params, // from page props
  {template: '/flow/[id]/[page]'},
);

// For custom routing
const adapter = createPathParamsAdapter({
  template: '/[id]/page/[page]',
});

<Flow
  graph={graph}
  config={{
    componentLoaders,
    urlParamsAdapter: adapter,
    pageParamName: 'page',
    uuidParamName: 'id',
  }}
/>;
```

### Conditional Routing

```tsx
const nodes = [
  {
    currentPage: 'checkout',
    nextPage: (state) => {
      if (state.paymentMethod === 'credit') return 'creditCardForm';
      if (state.paymentMethod === 'paypal') return 'paypalFlow';
      return 'paymentSelection';
    },
  },
];
```

### Skipping Pages

```tsx
const nodes = [
  {
    currentPage: 'optionalStep',
    shouldSkip: (state) => !state.needsOptionalStep,
    nextPage: 'nextStep',
  },
];
```

### Page Change Callback

`onPageChange` receives the new page, previous page, and accumulated state. It fires on initial load (with `previousPage` as `null`) and on every navigation. Use it to sync parent state or track analytics:

```tsx
<Flow
  graph={graph}
  config={{
    componentLoaders,
    onPageChange: (newPage, previousPage, state) => {
      setCurrentPage(newPage); // Sync with parent state
      analytics.track('page_view', {page: newPage});
      // state is merged from all pages - use for summaries, etc.
    },
  }}
/>
```

### Completing the flow

```tsx
function CompletePage() {
  const {completeFlow} = useFlow();

  const handleComplete = () => {
    completeFlow(); // Clears session storage
    // Navigate away or show success message
    router.push('/thank-you');
  };

  return <button onClick={handleComplete}>Finish</button>;
}
```

## API Reference

### Types

#### `FlowNode<TState>`

```tsx
type FlowNode<TState = FlowState> = {
  currentPage: string;
  nextPage?: string | ((state: TState) => string | null);
  previousPageFallback?: string;
  shouldSkip?: (state: TState) => boolean;
};
```

#### `FlowGraph`

```tsx
type FlowGraph = {
  nodes: Map<string, FlowNode>;
  entryPoint?: string;
};
```

#### `FlowConfig`

```tsx
type FlowConfig = {
  urlParamsAdapter?: UrlParamsAdapter;
  pageParamName?: string; // default: "page"
  uuidParamName?: string; // default: "id"
  onPageChange?: (
    page: string | null,
    previousPage: string | null,
    state: FlowState,
  ) => void;
  enableState?: boolean; // default: true
  componentLoaders: Map<string, ComponentLoader>;
};
```

### Graph Utilities

```tsx
// Create a graph from nodes
const graph = initializeFlow(nodes, entryPoint?);

// Validate graph structure
const { valid, errors } = validateGraph(graph);

// Get next/previous pages
const nextPage = getNextPage(graph, currentPage, state);
const previousPage = getPreviousPage(graph, currentPage, state);

// Get all pages in order
const pages = getPagesInOrder(graph);
```

## Examples

See the `playground/` directory for complete examples including:

- Basic multi-step form
- Conditional routing
- Path-based URLs
- Query param URLs
- Page skipping

## License

MIT
