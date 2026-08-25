---
name: create-hpux-ticket
description: >-
  Create Jira Epics and Stories in the HPUX project following UX team standards,
  and break down existing Epics into Stories. Use when the user asks to create a
  Jira ticket, epic, story, or design task, or says "create a new ticket",
  "file a ticket", "I need a Jira for...", "break down this epic",
  "decompose HPUX-...", or "create stories for HPUX-...".
---

# Create HPUX Ticket

## Workflow Overview

This skill supports three modes:

1. **Create Epic** — with optional parent linking to Initiatives or cross-project epics
2. **Create Story** — standalone or under an existing Epic
3. **Break Down Epic** — read an existing Epic and generate Stories from it

Determine the mode from context. If unclear, ask.

## Configuration

| Setting | Value |
|---------|-------|
| **Atlassian cloudId** | `2b9e35e3-6bd3-4cec-b838-f4249ee02432` (redhat.atlassian.net) |

All Jira tool calls require the `cloudId` parameter.

## Constraints

- Always use the **HPUX** project key
- Never combine Epic and Story fields
- Never guess required fields — always ask
- Preserve all description section headers, even if content is blank
- Confirm the full ticket summary before submitting
- When creating an Epic, always ask about parent linkage

---

# Mode 1: Create Epic

## Step 1: Gather Requirements

If the designer provides details, extract them. If not, enter **interview mode**.

### Interview Mode (No Details Provided)

Ask all questions in a single message — do not ask one at a time.

1. What's the title/summary?
2. Which components? (CNV, MTV, ACM, Virt initiative, ROSA, ARO, OSD, OCM, OCP, Observability)
3. T-shirt size? (XS, S, M, L, XL)
4. **Parent issue?** Does this Epic belong under a higher-level parent? This can be:
   - An **Initiative** in HPUX (e.g., HPUX-1185)
   - A **product team epic** in another project (e.g., CNV-12345, OCPBUGS-456)
   - If a product team epic, we'll use an "Informs" link instead of parent
   - None / standalone is fine too
5. Target release / fix version?
6. Description sections — answer what you know, skip what you don't:
   - Background info and relevant links
   - Problem statement
   - Goals for the work
   - Customer input or feedback
   - How will success be tracked?
   - Definition of done
   - Existing design artifacts?

## Step 2: Populate Fields

| Field | Value |
|-------|-------|
| Issue Type | Epic |
| Parent | HPUX parent issue key if provided (e.g., Initiative). Set via `{"parent": "HPUX-XXX"}` in additional_fields |
| Components | One or more of: CNV, MTV, ACM, Virt initiative, ROSA, ARO, OSD, OCM, OCP, Observability |
| T-Shirt Size | XS, S, M, L, or XL |
| Labels | Exactly one problem-statement label (see below) |
| Fix Version | Target release (must exist in HPUX — contact Peter Kreuser if missing) |

**Parent vs. Informs — when to use which:**
- **Parent field** (`additional_fields: {"parent": "KEY-123"}`) — use when the parent is in the **same project** (HPUX) or the Jira hierarchy supports it. This creates a true parent-child relationship visible in the hierarchy view.
- **Informs link** — use when linking to a **cross-project** product team epic (e.g., CNV-XXX, ROX-XXX). Create the Epic first, then manually add the "Informs" link in Jira (the official Atlassian MCP does not support creating issue links programmatically).

**Problem Statement Labels** (assign based on description):
- `problem-statement-uxd-data-driven` — based on UXDR/PWDR research
- `problem-statement-data-driven` — based on research from outside UX (BU, Marketing, Engineering)
- `problem-statement-assumption` — based on assumptions, not validated research
- `problem-statement-undefined` — no problem statement defined (default if unclear)

## Step 3: Populate Description

Use the Epic template. Replace placeholders with designer's content.
**Keep all section headers even if content is blank.**

```
Description / Background info
[What information would someone need to understand why we are focusing on this? What links are helpful for understanding?]

Problem statement
[What issue does the design aim to address? Write up a problem statement describing this and add a label to the jira accordingly.]

Goals for the work
[What are we trying to accomplish with this effort?]

Customer input
[Did any direct customer feedback influence us doing this? If so, include a summary and ideally a link to it here.]

Tracking success
[What analytics or verbatims will we track, or how will we know this change was successful? By specifying this now we will know what pieces of information need to be tracked in the code.]

Definition of done
[What concrete logistical things must be done for this story to be considered 'done'? Create the design doc? Link/share certain places? Share at certain meetings? "Sign off" by certain stakeholders? Make a bulleted list here.]

Design artifacts
[Any existing designs for this effort that should be built upon? Otherwise leave blank until deliverables are created and linked here.]
Prototype links (when a prototype exists): https://openshift-platform-prototype.vercel.app/{path from src/app/routes.ts} — specific list or details page, not the site root. Never use openshift-console-mock.vercel.app or /k8s/ns/... console-core paths.
```

## Step 4: Confirm and Create

1. Show the designer a complete summary including parent linkage
2. Wait for their confirmation
3. Create the Epic via `createJiraIssue`:
   - Set `project_key: "HPUX"`, `issue_type: "Epic"`
   - If HPUX parent: include `{"parent": "HPUX-XXX"}` in `additional_fields`
4. If cross-project "Informs" link was specified, remind the user to add it
   manually in Jira: go to the newly created HPUX epic → Link → "Informs"
   → enter the product team epic key (e.g., CNV-XXX, ROX-XXX).

---

# Mode 2: Create Story

## Step 1: Gather Requirements

Ask all questions in a single message — do not ask one at a time.

1. Story under an existing Epic, or standalone?
2. If under Epic — parent HPUX Epic ID?
3. What's the title/summary?
4. Which components? (CNV, MTV, ACM, Virt initiative, ROSA, ARO, OSD, OCM, OCP, Observability)
5. Activity type?
6. Story points?
7. Description sections — answer what you know, skip what you don't:
   - Background info and relevant links
   - Goals for the work
   - Definition of done
   - Existing design artifacts?

## Step 2: Populate Fields

| Field | Value |
|-------|-------|
| Issue Type | Story (never Task) |
| Parent | HPUX Epic ID if applicable. Set via `{"parent": "HPUX-XXX"}` in additional_fields |
| Components | One or more of: CNV, MTV, ACM, Virt initiative, ROSA, ARO, OSD, OCM, OCP, Observability |
| Activity Type | Type of UX work |
| Story Points | Based on scope (never guess — ask if missing) |

## Step 3: Populate Description

```
Description / Background info
[What information would someone need to understand why we are focusing on this? What links are helpful for understanding?]

Goals for the work
[What are we trying to accomplish with this effort?]

Definition of done
[What concrete logistical things must be done for this story to be considered 'done'? Create the design doc? Link/share certain places? Share at certain meetings? "Sign off" by certain stakeholders? Make a bulleted list here.]

Design artifacts
[Any existing designs for this effort that should be built upon? Otherwise leave blank until deliverables are created and linked here.]
Prototype links (when a prototype exists): https://openshift-platform-prototype.vercel.app/{path from src/app/routes.ts} — specific list or details page, not the site root. Never use openshift-console-mock.vercel.app or /k8s/ns/... console-core paths.
```

## Step 4: Confirm and Create

1. Show the designer a complete summary of the Story
2. Wait for their confirmation
3. Create the Story via `createJiraIssue`

---

# Mode 3: Break Down Epic into Stories

Use this mode when the user says things like "break down HPUX-1393",
"decompose this epic into stories", or "create stories for HPUX-XXX".

## Step 1: Read the Epic

Fetch the epic using `getJiraIssue`:

```
Tool: getJiraIssue (user-Atlassian-MCP-Server)
- issue_key: "<HPUX-XXX>"
- fields: "*all"
```

Extract from the epic:
- **Summary** — the epic title
- **Description** — parse out all sections (Background, Problem statement, Goals, Definition of done, etc.)
- **Components** — inherit for child stories
- **Labels** — note for context
- **Assignee** — default assignee for stories (can be overridden)
- **Existing children** — check if stories already exist under this epic

To check for existing children:

```
Tool: searchJiraIssuesUsingJql (user-Atlassian-MCP-Server)
- jql: "parent = HPUX-XXX ORDER BY created ASC"
- fields: "summary,status,assignee"
```

If stories already exist, show them to the user and ask whether to add more
or start fresh.

## Step 2: Propose Stories

Analyze the epic's description and break it into discrete stories. Follow
these principles:

**How to decompose:**
- Each story should represent a **single deliverable** or **distinct phase** of the design work
- Common story patterns for UX epics:
  - **Discovery / Research** — stakeholder interviews, competitive analysis, user research
  - **Requirements & Scoping** — requirements gathering, alignment with PM/Eng
  - **Design Exploration** — initial concepts, wireframes, low-fidelity mocks
  - **High-Fidelity Design** — detailed mocks, interaction specs, responsive states
  - **Prototype** — clickable prototype for validation or dev handoff
  - **Content Review** — UX content/copy review with content design
  - **Stakeholder Review & Sign-off** — review with BU, Eng, and UX leads
  - **Dev Handoff** — design documentation, specs, Figma annotations
  - **Design QA** — verify implementation matches design intent
  - **Blog / Communication** — write-up, demo, or share-out of the work
- Not every epic needs all of these — use judgment based on the epic's scope
- If the epic description mentions specific deliverables or phases, use those
- If the Definition of Done has a checklist, each item may map to a story

**For each proposed story, include:**
- **Title** — concise, specific (not generic like "Do design work")
- **Components** — inherited from the epic
- **Description** — use the Story template, with:
  - Background referencing the parent epic (link to it)
  - Goals scoped to this specific story
  - Definition of done for this story only
- **Suggested story points** — estimate based on scope, but flag as "suggested"
- **Suggested activity type** — based on the nature of the story

## Step 3: Present the Plan

Show the user the full breakdown as a numbered list:

```
Epic: HPUX-XXX — <Epic Title>
Components: <inherited>
Existing stories: <count, if any>

Proposed new stories:

1. <Title>
   Points: <suggested>  |  Activity: <type>
   Goal: <1-sentence summary>

2. <Title>
   Points: <suggested>  |  Activity: <type>
   Goal: <1-sentence summary>

...
```

Ask the user to:
- **Approve all** — create them as-is
- **Edit** — modify titles, points, or descriptions before creating
- **Remove** — drop specific stories from the list
- **Add** — suggest additional stories they want included

Do NOT create any stories until the user confirms.

## Step 4: Create Stories

Once confirmed, create all stories using `createJiraIssue` individually.

For each story:

```
Tool: createJiraIssue (user-Atlassian-MCP-Server)
- project_key: "HPUX"
- summary: "<story title>"
- issue_type: "Story"
- description: "<populated Story template>"
- components: "<inherited from epic>"
- additional_fields: {"parent": "HPUX-XXX"}
```

Set parent via additional_fields on each call.

## Step 5: Report Results

After creation, show a summary:

```
✅ Created 5 stories under HPUX-XXX:

1. HPUX-1410: Discovery research with ACS stakeholders (3 pts)
2. HPUX-1411: Requirements alignment with PM and Eng (2 pts)
3. HPUX-1412: High-fidelity design mocks (5 pts)
4. HPUX-1413: Stakeholder review and sign-off (2 pts)
5. HPUX-1414: Dev handoff documentation (3 pts)

Total: 15 story points
```

Include links to each created story:
`https://redhat.atlassian.net/browse/HPUX-XXXX`

