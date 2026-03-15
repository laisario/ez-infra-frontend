# Discovery/Architecture Layout Refactor — Implementation Report

## What Was Changed

### Layout & Structure

1. **DiscoveryHeader** (new)
   - Horizontal pipeline stepper: Descoberta → Arquitetura → Revisão → Terraform
   - GitHub status: `owner/repo` (link) or "GitHub não conectado"
   - "Pular para arquitetura" button (same eligibility logic as before)

2. **DiscoveryPipelineStepper** (new)
   - Horizontal progress indicator with states: current, completed, disabled, upcoming
   - Reuses `isPhaseReady` for enable/disable
   - Compact layout for header use

3. **DiscoveryPage**
   - Lifted `selectedPhase`, `architectureTriggered`, `isSkippingToArchitecture` to page level
   - Renders `DiscoveryHeader` between TopBar and main content
   - Hides chat when `selectedPhase === "architecture"`
   - Architecture content uses full width when chat is hidden

4. **DiscoveryRightPanel**
   - Receives `selectedPhase`, `onPhaseSelect`, `architectureTriggered`, `isReadyForArchitecture`, `onStartArchitecture`, `isSkippingToArchitecture` from parent
   - Removed PhasePipeline card (moved to header)
   - Removed internal architecture state (lifted to page)

5. **DiagramsPanel**
   - Tabs for "Arquitetura econômica" / "Arquitetura performance"
   - One vibe shown at a time with description, cost, resources list, and diagram
   - Larger diagram area (min-h 400px)

6. **GitHubRepoPanel**
   - Removed "Pular para arquitetura" (now in header)
   - Kept repo linking and status display

### Backend Fields Used

- `context.repo_url` — GitHub URL
- `checklist` (key `repo_url` or `repository`, status `confirmed`) — repo evidence
- `readiness.status` — `maybe_ready`, `ready_for_architecture`
- `session.state` — `architecture_ready`, `architecture_in_progress`
- `GET /projects/:projectId/architecture-result` — architecture data
- `POST /projects/:projectId/start-architecture` — start architecture flow

### Suggested Backend Additions

- **Repo slug/owner** — `context` could expose `repo_owner` and `repo_name` to avoid parsing the URL
- **Phase progress** — explicit phase/step field to drive pipeline state
- **Architecture status** — clearer status for "in progress" vs "ready" vs "failed"
