# Roam Technical Diagrams (10 Pages)

This document provides a 10-page technical diagram set for how the Roam app works end-to-end.

---

## Page 1 - System Architecture Overview

```mermaid
flowchart LR
  U[Choreographer / Team User] --> B[Browser App - index.html + app.js + styles.css]
  B --> LS[(Local Storage State)]
  B --> SBJS[Supabase JS Client]
  SBJS --> AUTH[Supabase Auth]
  SBJS --> DB[(Supabase Postgres)]
  B --> CI[GitHub CI Signals]
  CI --> GH[GitHub Actions]
  GH --> T[Test Gate: check + e2e]
```

```mermaid
flowchart TD
  subgraph Frontend
    UI[UI Cards + Controls]
    SVC[State + Event Logic]
    MET[Growth Metrics]
    SYNC[Cloud Sync + Retry Queue]
  end

  subgraph Cloud
    A[Auth]
    US[(roam_user_state)]
    GI[(roam_growth_invites)]
    GW[(roam_growth_waitlist)]
  end

  UI --> SVC
  SVC --> MET
  SVC --> SYNC
  SYNC --> A
  SYNC --> US
  SYNC --> GI
  SYNC --> GW
```

---

## Page 2 - Frontend Module Map

```mermaid
flowchart TB
  App[app.js] --> State[State Store]
  App --> Render[Render Layer]
  App --> Handlers[Event Handlers]
  App --> Growth[Growth Engine]
  App --> Cloud[Cloud Sync Engine]
  App --> TestHooks[Testable UI IDs]

  Render --> R1[Session Card]
  Render --> R2[Dancers Card]
  Render --> R3[Sections Card]
  Render --> R4[Assignments Card]
  Render --> R5[References Card]
  Render --> R6[Takes Card]
  Render --> R7[Analytics Card]
  Render --> R8[Growth Card]
  Render --> R9[Cloud Card]
```

```mermaid
classDiagram
  class AppState {
    locale
    session
    dancers[]
    sections[]
    assignments[]
    references[]
    takes[]
    onboarding{}
    cloud{}
    growth{}
  }

  class CloudState {
    url
    anonKey
    user
  }

  class GrowthState {
    referralCode
    inviteLog[]
    waitlist[]
    sharePacksGenerated
    pendingCloudWrites[]
    attribution{}
    events[]
  }

  AppState --> CloudState
  AppState --> GrowthState
```

---

## Page 3 - Core Choreography Workflow

```mermaid
sequenceDiagram
  participant User
  participant UI as Browser UI
  participant State as Local State

  User->>UI: Create Session
  UI->>State: session = {id,name}
  User->>UI: Add Dancer
  UI->>State: dancers.push(...)
  User->>UI: Add Section
  UI->>State: sections.push(...)
  User->>UI: Assign Section to Dancer
  UI->>State: assignments.push(...)
  User->>UI: Save Reference URL
  UI->>UI: parse timestamp (t/start/hash)
  UI->>State: references.push(...)
  User->>UI: Log Take
  UI->>State: takes.push(...)
  UI->>UI: Render Analytics + My Sections
```

```mermaid
flowchart TD
  A[Session Active] --> B[Section Added]
  B --> C[Assignment Created]
  C --> D[Reference Saved]
  D --> E[Take Logged]
  E --> F[Section Progress Visible]
  F --> G[Choreographer Iterates]
```

---

## Page 4 - Data Model and Relationships

```mermaid
erDiagram
  SESSION ||--o{ SECTION : contains
  SECTION ||--o{ ASSIGNMENT : has
  DANCER ||--o{ ASSIGNMENT : receives
  SECTION ||--o{ REFERENCE : links
  SECTION ||--o{ TAKE : logs

  SESSION {
    string id
    string name
  }
  SECTION {
    string id
    string name
    string status
  }
  DANCER {
    string id
    string name
    string role
  }
  ASSIGNMENT {
    string id
    string sectionId
    string dancerId
    string status
    string dueDate
  }
  REFERENCE {
    string id
    string sectionId
    string url
    string timestamp
  }
  TAKE {
    string id
    string sectionId
    string type
    number durationSec
    string notes
  }
```

```mermaid
flowchart LR
  LS[(Local Storage JSON)]
  LS --> S[session]
  LS --> D[dancers]
  LS --> C[sections]
  LS --> A[assignments]
  LS --> R[references]
  LS --> T[takes]
  LS --> G[growth]
  LS --> CL[cloud]
```

---

## Page 5 - Sync and Retry Queue

```mermaid
stateDiagram-v2
  [*] --> LocalWrite
  LocalWrite --> CloudAttempt : cloud configured + signed in
  LocalWrite --> Queued : cloud unavailable / error
  CloudAttempt --> Synced : insert/upsert success
  CloudAttempt --> Queued : insert/upsert error
  Queued --> AutoFlush : timer tick / online event
  AutoFlush --> Synced : success
  AutoFlush --> Queued : still failing
  Synced --> [*]
```

```mermaid
sequenceDiagram
  participant UI
  participant Queue as pendingCloudWrites[]
  participant Supabase

  UI->>Queue: enqueue({type,payload}) on failure
  Note over Queue: stored in local state
  UI->>UI: set sync banner status
  UI->>Queue: flushPendingCloudWrites()
  alt success
    Queue->>Supabase: insert row
    Supabase-->>Queue: ok
    Queue->>Queue: remove item
  else fail
    Queue->>Supabase: insert row
    Supabase-->>Queue: error
    Queue->>Queue: keep item
  end
```

---

## Page 6 - Growth Engine and Attribution

```mermaid
flowchart TD
  RefURL[URL with ?ref=CODE] --> Capture[Capture Attribution]
  Capture --> GrowthState[growth.attribution]
  GrowthState --> Invite[Send Invite]
  GrowthState --> Waitlist[Join Waitlist]
  Invite --> InviteLog[growth.inviteLog]
  Waitlist --> WaitlistLog[growth.waitlist]
  InviteLog --> KPI[Growth Funnel KPIs]
  WaitlistLog --> KPI
```

```mermaid
flowchart LR
  A[Generate Referral Code] --> B[Copy Referral Link]
  B --> C[Invite Sent]
  C --> D[Waitlist Join]
  D --> E[Activation Events]
  E --> F[Weekly Growth Report]
```

---

## Page 7 - Share Pack Collaboration Flow

```mermaid
sequenceDiagram
  participant Owner as Team Owner
  participant App as Roam App
  participant Pack as Base64 Share Payload
  participant Receiver as Collaborator

  Owner->>App: Select section + generate pack
  App->>Pack: encode(section + assignments + refs + takes)
  Owner->>Receiver: send payload
  Receiver->>App: paste payload + import
  App->>App: create imported section
  App->>App: map assignments/references/takes
  App->>Receiver: imported section ready
```

```mermaid
flowchart TD
  Start[Select Section] --> Snapshot[Collect Section Artifacts]
  Snapshot --> Encode[Base64 JSON Encode]
  Encode --> Share[Copy/Send Payload]
  Share --> Import[Decode Payload]
  Import --> Rebuild[Recreate Entities]
  Rebuild --> Done[Imported Collaboration Context]
```

---

## Page 8 - Security and RLS Model

```mermaid
flowchart LR
  Browser[Browser Client]
  Browser -->|publishable/anon key| Supabase[Supabase]
  Browser -.x.|never use| ServiceRole[Service Role Key]
  Supabase --> Auth[Auth Session]
  Auth --> RLS[RLS Policies]
  RLS --> UserState[(roam_user_state)]
  RLS --> GrowthInv[(roam_growth_invites)]
  RLS --> Waitlist[(roam_growth_waitlist)]
```

```mermaid
flowchart TD
  U[Authenticated User] --> P1{Policy Check}
  P1 -->|auth.uid() == user_id| RW1[Read/Write Own State]
  P1 -->|otherwise| Deny1[Deny]

  U --> P2{Invite Policy}
  P2 -->|auth.uid() == owner_user_id| W2[Insert/Read own invites]
  P2 -->|otherwise| Deny2[Deny]

  V[Anon or Auth Visitor] --> P3{Waitlist Insert}
  P3 -->|allowed by policy| W3[Insert Waitlist Lead]
```

---

## Page 9 - CI/CD and Test Gate

```mermaid
flowchart TD
  Dev[Developer Change] --> Git[Push / PR]
  Git --> GH[GitHub Actions: roam-site-ci]
  GH --> Install[npm ci]
  Install --> PW[npx playwright install chromium]
  PW --> Gate[npm run test:ci]
  Gate --> Check1[check-static-site]
  Gate --> Check2[playwright e2e]
  Check1 --> Result{All Pass?}
  Check2 --> Result
  Result -->|yes| Merge[Merge Ready]
  Result -->|no| Fix[Fix + Re-run]
```

```mermaid
flowchart LR
  A[test:e2e core-flows] --> Q[Quality Gate]
  B[test:e2e share-pack] --> Q
  C[test:e2e cloud-queue] --> Q
  D[static check] --> Q
```

---

## Page 10 - Operations and Runbook View

```mermaid
flowchart TD
  Ops[Operator] --> Snapshot[Download Ops Snapshot JSON]
  Snapshot --> Metrics[Review Counts + Weekly Growth]
  Metrics --> Decision{Issue Detected?}
  Decision -->|No| Continue[Continue Weekly Plan]
  Decision -->|Yes| Action[Take Corrective Action]
  Action --> Retry[Flush Pending Cloud Writes]
  Action --> CI[Run test:ci]
  Action --> Outreach[Adjust Growth Tactic]
```

```mermaid
stateDiagram-v2
  [*] --> Pilot
  Pilot --> Repeatable : hit 50-user gate
  Repeatable --> Scale : hit 200-user gate
  Scale --> Thousand : hit 1000-user gate
  Pilot --> PilotFix : activation drops
  Repeatable --> RepeatFix : invite conversion drops
  Scale --> ScaleFix : reliability regressions
  PilotFix --> Pilot
  RepeatFix --> Repeatable
  ScaleFix --> Scale
```

---

## Appendix - Legend

- **Local State**: browser persisted app JSON.
- **Pending Cloud Writes**: queued invite/waitlist writes for retry.
- **Activation**: completion of first-session choreography-critical steps.
- **Share Pack**: encoded portable section context for collaboration.
