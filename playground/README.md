# React Maestro · Playground

Vite + React + Tailwind playground to test **react-maestro-flow** locally. Uses the full test wizard with branching logic. Not part of the published package.

## Setup

From **project root**:

```bash
npm run build              # build the library first
npm run playground:install # install playground dependencies (once)
npm run playground        # builds library, then starts playground dev server
```

Or manually:

```bash
npm run build
cd playground && npm install && npm run dev
```

## Features

- **Full test wizard** – Uses the complete wizard graph from `src/wizard/test/test-wizard.ts`
- **All test pages** – PageA, PageB, PageC, PageD, PageE with branching logic
- **Tailwind CSS** – Styled components matching the test pages
- **Button component** – Simple Button component for navigation
- **react-maestro-flow** – consumed via `file:..` (parent directory). Not a published dependency.

## Test Flow

1. **Page A** – Enter name, age, address
2. **Page B** – Enter email, select user type (standard/premium)
   - **Standard** → Page C (auto-skips) → Page D
   - **Premium** → Page E → Page D
3. **Page D** – Final confirmation page

## Edit flow

1. Change library code in `src/`.
2. Run `npm run build` (or `npm run dev` in another terminal for watch).
3. Refresh the playground; it uses the built `dist/` output.
