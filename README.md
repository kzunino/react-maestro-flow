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
import { Wizard, createWizardGraphFromNodes, useWizard } from "react-maestro";

// 1. Define your pages as nodes
const nodes = [
  {
    currentPage: "step1",
    nextPage: "step2",
  },
  {
    currentPage: "step2",
    nextPage: (state) => {
      // Conditional routing based on state
      return state.userType === "premium" ? "premiumStep" : "standardStep";
    },
  },
  {
    currentPage: "premiumStep",
    nextPage: "complete",
  },
  {
    currentPage: "standardStep",
    nextPage: "complete",
  },
];

// 2. Create the graph
const graph = createWizardGraphFromNodes(nodes, "step1");

// 3. Define component loaders
const componentLoaders = new Map([
  ["step1", () => import("./pages/Step1")],
  ["step2", () => import("./pages/Step2")],
  ["premiumStep", () => import("./pages/PremiumStep")],
  ["standardStep", () => import("./pages/StandardStep")],
  ["complete", () => import("./pages/Complete")],
]);

// 4. Use the Wizard component
function App() {
  return (
    <Wizard
      graph={graph}
      config={{
        componentLoaders,
      }}
    />
  );
}

// 5. In your page components, use the hook
function Step1() {
  const { stateKey, goToNext, hasNext } = useWizard();
  const [name, setName] = stateKey<string>("name");

  return (
    <div>
      <input
        value={name || ""}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your name"
      />
      <button onClick={goToNext} disabled={!hasNext}>
        Next
      </button>
    </div>
  );
}
```

## Configuration

### Wizard Component Props

```tsx
<Wizard
  graph={WizardGraph}
  config={{
    // Optional: URL params adapter (defaults to query params)
    urlParamsAdapter?: UrlParamsAdapter,
    
    // Optional: URL param names (defaults shown)
    pageParamName?: string, // default: "page"
    uuidParamName?: string, // default: "id"
    
    // Optional: Callback when page changes
    onPageChange?: (page: string | null, previousPage: string | null) => void,
    
    // Required: Map of page IDs to component loaders
    componentLoaders: Map<string, ComponentLoader>,
  }}
/>
```

### WizardNode Properties

Each node in your graph can have:

```tsx
{
  currentPage: string; // Required: Unique page identifier
  
  nextPage?: string | ((state: WizardState) => string | null);
  // Optional: Next page(s). Can be:
  // - A string: "nextPageId"
  // - A function: (state) => state.condition ? "pageA" : "pageB"
  
  previousPageFallback?: string;
  // Optional: Fallback previous page for hasPrevious() checks
  // (Back navigation uses browser history by default)
  
  shouldSkip?: (state: WizardState) => boolean;
  // Optional: Skip this page if function returns true
  // Skipped pages are automatically bypassed
}
```

## useWizard Hook

The `useWizard` hook provides access to all wizard functionality:

```tsx
const {
  // Current state
  currentPage: string | null,
  state: WizardState, // Accumulated state from all pages
  
  // Navigation
  goToNext: () => void,
  goToPrevious: () => void,
  goToPage: (page: string) => void, // Preserves history
  skipToPage: (page: string) => void, // Replaces history
  
  // State management
  stateKey: <T>(key: string) => [T | undefined, (value: T) => void],
  updateState: (key: string, value: unknown) => void,
  updateStateBatch: (updates: Record<string, unknown>) => void,
  getPageState: (page: string) => WizardState,
  
  // Navigation info
  hasNext: boolean,
  hasPrevious: boolean,
  
  // Utilities
  getCurrentNode: () => WizardNode | undefined,
  getNode: (page: string) => WizardNode | undefined,
  skipCurrentPage: () => void,
  completeWizard: () => void,
  
  // URL params
  getUrlParam: (key: string) => string | null,
  getAllUrlParams: () => Record<string, string>,
  urlParams: Record<string, string>,
} = useWizard();
```

### State Management

#### Using `stateKey` (Recommended)

```tsx
const [name, setName] = stateKey<string>("name");
const [email, setEmail] = stateKey<string>("email");

// Use like useState
<input value={name || ""} onChange={(e) => setName(e.target.value)} />
```

#### Using `updateState` / `updateStateBatch`

```tsx
updateState("name", "John");
updateStateBatch({ name: "John", email: "john@example.com" });
```

#### Getting State

```tsx
// Get all accumulated state
const allState = state; // { name: "John", email: "...", ... }

// Get state for a specific page
const step1State = getPageState("step1");
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
goToPage("step5");

// Skip to a page (replaces history - no back button)
// Useful after API calls
const result = await checkEligibility();
if (result.eligible) {
  skipToPage("checkout");
} else {
  skipToPage("notEligible");
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
const userId = getUrlParam("userId");

// Get all params
const allParams = getAllUrlParams(); // { page: "step1", id: "abc123", userId: "456" }

// Reactive params (updates on navigation)
const { userId, type } = urlParams;
```

## Advanced Usage

### Path-Based URLs (Next.js, Remix, etc.)

```tsx
import { createPathParamsAdapter, Wizard } from "react-maestro";

// For Next.js App Router
const adapter = createPathParamsAdapterFromProps(
  params, // from page props
  { template: "/wizard/[id]/[page]" }
);

// For custom routing
const adapter = createPathParamsAdapter({
  template: "/[id]/page/[page]",
});

<Wizard
  graph={graph}
  config={{
    componentLoaders,
    urlParamsAdapter: adapter,
    pageParamName: "page",
    uuidParamName: "id",
  }}
/>
```

### Conditional Routing

```tsx
const nodes = [
  {
    currentPage: "checkout",
    nextPage: (state) => {
      if (state.paymentMethod === "credit") return "creditCardForm";
      if (state.paymentMethod === "paypal") return "paypalFlow";
      return "paymentSelection";
    },
  },
];
```

### Skipping Pages

```tsx
const nodes = [
  {
    currentPage: "optionalStep",
    shouldSkip: (state) => !state.needsOptionalStep,
    nextPage: "nextStep",
  },
];
```

### Page Change Callback

```tsx
<Wizard
  graph={graph}
  config={{
    componentLoaders,
    onPageChange: (newPage, previousPage) => {
      // Track analytics, update UI, etc.
      analytics.track("page_view", { page: newPage });
    },
  }}
/>
```

### Completing the Wizard

```tsx
function CompletePage() {
  const { completeWizard } = useWizard();

  const handleComplete = () => {
    completeWizard(); // Clears session storage
    // Navigate away or show success message
    router.push("/thank-you");
  };

  return <button onClick={handleComplete}>Finish</button>;
}
```

## API Reference

### Types

#### `WizardNode<TState>`

```tsx
type WizardNode<TState = WizardState> = {
  currentPage: string;
  nextPage?: string | ((state: TState) => string | null);
  previousPageFallback?: string;
  shouldSkip?: (state: TState) => boolean;
};
```

#### `WizardGraph`

```tsx
type WizardGraph = {
  nodes: Map<string, WizardNode>;
  entryPoint?: string;
};
```

#### `WizardConfig`

```tsx
type WizardConfig = {
  urlParamsAdapter?: UrlParamsAdapter;
  pageParamName?: string; // default: "page"
  uuidParamName?: string; // default: "id"
  onPageChange?: (page: string | null, previousPage: string | null) => void;
  componentLoaders: Map<string, ComponentLoader>;
};
```

### Graph Utilities

```tsx
// Create a graph from nodes
const graph = createWizardGraphFromNodes(nodes, entryPoint?);

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
