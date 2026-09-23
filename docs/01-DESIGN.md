# TaskFlow — Product & UI Design

## Design Goal

TaskFlow should feel like a modern productivity application rather than an academic CRUD project.

Design priorities:

1. Simple
2. Fast
3. Clear
4. Responsive
5. Professional
6. Minimal visual clutter

The application should make the current task and active timer immediately obvious.

---

# Design System

## Visual Direction

Use:

- Clean dashboard layout
- Soft borders
- Rounded cards
- Clear typography hierarchy
- Consistent spacing
- Subtle hover states
- Minimal animation
- Responsive mobile-first behavior

Avoid:

- Excessive gradients
- Excessive glassmorphism
- Huge hero sections
- Unnecessary animations
- Too many colors
- Dense tables on mobile

---

# Main Navigation

Desktop:

```text
┌──────────────────────────────────────────────────────┐
│ TaskFlow       Dashboard  Tasks  Time Logs  Analytics │
│                                             User ▼   │
└──────────────────────────────────────────────────────┘
```

Mobile:

```text
┌──────────────────────────┐
│ TaskFlow             ☰   │
└──────────────────────────┘
```

---

# Dashboard

The dashboard is the primary screen.

```text
┌────────────────────────────────────────────────────┐
│ Good evening 👋                                    │
│ Tuesday, September 22                              │
│                                                    │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│ │ 4h 32m   │ │ 6        │ │ 3        │ │ 3      │ │
│ │ Time     │ │ Worked   │ │ Done     │ │ Active │ │
│ └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│                                                    │
│ ┌───────────────────────┐ ┌─────────────────────┐ │
│ │ Active Timer          │ │ Today's Tasks       │ │
│ │                       │ │                     │ │
│ │ Build API             │ │ ✓ Authentication    │ │
│ │                       │ │ ◉ Timer             │ │
│ │      01:42:35         │ │ ○ Analytics         │ │
│ │                       │ │                     │ │
│ │       STOP            │ │ + Create Task       │ │
│ └───────────────────────┘ └─────────────────────┘ │
│                                                    │
│ ┌────────────────────────────────────────────────┐ │
│ │ Today's Activity                              │ │
│ │              productivity chart               │ │
│ └────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
```

---

# Task List

Each task should show:

```text
┌──────────────────────────────────────────────┐
│ ◉ Follow Up with UI Designer                │
│   Confirm wireframe delivery status          │
│                                              │
│   IN PROGRESS     01h 20m        STOP       │
└──────────────────────────────────────────────┘
```

Task states:

- PENDING → neutral
- IN_PROGRESS → active indicator
- COMPLETED → completed indicator

Do not rely only on color. Use text/icons as well.

---

# Create Task Modal

Natural language should be the primary input.

```text
┌─────────────────────────────────────────────┐
│ Create Task                             ×   │
│                                             │
│ What do you need to do?                    │
│ ┌─────────────────────────────────────────┐ │
│ │ follow up with designer                 │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│              ✨ Improve with AI             │
│                                             │
│ Title                                       │
│ ┌─────────────────────────────────────────┐ │
│ │ Follow Up with UI Designer              │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Description                                 │
│ ┌─────────────────────────────────────────┐ │
│ │ Contact the UI designer to confirm...   │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Cancel                         Create Task  │
└─────────────────────────────────────────────┘
```

AI suggestions must remain editable before saving.

---

# Timer UX

When inactive:

```text
[ Start Tracking ]
```

When active:

```text
┌─────────────────────────┐
│ ● Tracking              │
│                         │
│      01:42:35           │
│                         │
│       [ Stop ]          │
└─────────────────────────┘
```

The active timer should be visually prominent.

---

# Time Logs

Use a readable timeline/table.

```text
Task                  Started       Ended        Duration
----------------------------------------------------------
Build API             10:00         10:45        45m
Authentication        11:00         12:20        1h 20m
Dashboard             14:00         15:30        1h 30m
```

Mobile should transform rows into cards.

---

# Empty States

Never leave blank screens.

Example:

```text
No tasks yet

Create your first task and start tracking your work.

[ Create Task ]
```

---

# Loading States

Use skeletons for dashboard cards, task lists, and charts.

Buttons should show loading state during mutations:

```text
Saving...
Generating...
Starting...
Stopping...
```

---

# Error States

Errors should be human-readable.

Example:

```text
Unable to start timer.

You already have an active timer.

[ View Active Timer ]
```

Avoid exposing stack traces to users.

---

# Responsive Behavior

Desktop:

- Sidebar/top navigation
- Multi-column dashboard
- Tables

Tablet:

- Reduced columns
- Flexible cards

Mobile:

- Single column
- Bottom or hamburger navigation
- Cards instead of dense tables
- Full-width buttons

---

# Accessibility

Must support:

- Keyboard navigation
- Visible focus states
- Semantic buttons
- Labels for inputs
- Accessible dialogs
- Proper contrast
- Screen-reader-friendly status messages

---

# Design Definition of Done

Before calling UI complete:

- [ ] Desktop responsive
- [ ] Tablet responsive
- [ ] Mobile responsive
- [ ] Loading states
- [ ] Empty states
- [ ] Error states
- [ ] Accessible forms
- [ ] Consistent spacing
- [ ] Consistent button styles
- [ ] Timer is visually obvious
- [ ] AI feature is understandable
