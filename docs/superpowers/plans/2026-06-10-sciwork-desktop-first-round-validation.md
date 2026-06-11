# SciWork Desktop First-Round Validation Notes

Date: 2026-06-10

## Commands Run

- `npm run test:run`
- `npm run build`
- `npm run dev:vite`
- Browser plugin verification attempted against `http://127.0.0.1:5173/`

## Automated Validation Result

- `npm run test:run` passed on 2026-06-10: 6 test files, 19 tests.
- `npm run build` passed on 2026-06-10: typecheck, tests, Vite build, and Electron build all completed.
- `dist/` was generated.
- `dist-electron/` was generated.
- The workspace is not a Git repository; `git status --short` returns `fatal: not a git repository`.

## Production Asset Path Check

- `vite.config.ts` uses `base: './'`, so the production `dist/index.html` references JS and CSS with relative paths under Electron `loadFile`.
- `src/theme/themeRegistry.ts` now builds background and character URLs from `import.meta.env.BASE_URL`, keeping generated assets replaceable while avoiding file-protocol root paths.
- `dist/index.html` contains `src="./assets/index-*.js"` and `href="./assets/index-*.css"`.
- `rg -n 'src="/|href="/|/themes/|/characters/' .\dist` returned no matches for unsafe root-path asset references.
- `dist/themes/sciwork-theme-qiushi-blue-graph-zju-v2.png` exists.
- `dist/characters/sciwork-character-scientist-assistant-zju-v2.png` exists.

## Local Runtime Result

- Vite served `http://127.0.0.1:5173/` and an HTTP probe returned `200`.
- Electron processes launched from this workspace during validation.
- GUI could not be visually inspected in the current Windows sandbox.
- In-app Browser automation failed with a Windows sandbox startup error, so the manual click-through workflow could not be completed in this environment.
- The temporary Vite verification server was stopped after validation.

## Expected Manual Workflow

When opened locally, the manual workflow should be:

1. Click `Analyze Literature`.
2. Click `Generate Report`.
3. Type `prefer mild conditions and shorter reaction time`.
4. Click `Draft Protocol`.
5. Click `Validate with LabOntology`.
6. Click `Run Simulation`.
7. Click `Write Back to Experimental Graph`.
8. Click `Generate Next Suggestions`.

Expected final state:

- Active stage is `Next Suggestions`.
- Suggestion `Narrow solvent candidates` is visible.
- Right panel shows `Experimental Graph`.
- UI labels still say `Mock / Simulation` and `Queue With Approval`.

## Asset Registry Result

- Default ZJU-inspired background is loaded from `assets/themes/` by the theme registry.
- Scientist assistant is loaded from `assets/characters/` by the theme registry.
- Asset replacement is configuration-based through `src/theme/themeRegistry.ts`.
- The destructive/rename-based missing asset check was skipped to avoid unnecessary filesystem churn during final validation.

## Remaining Known Limits

- No real SciGraph-SCP connection.
- No real LabOntology service.
- No real device execution.
- No persistent database.
- No full PDF semantic parsing.
- Manual GUI/browser click-through needs to be run outside this sandbox for final visual acceptance.
