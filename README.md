# Shared Components

## Overview

This document identifies reusable UI components in Taskly after reviewing the currently implemented application screens and the available Figma designs.

The review covered:

- Login
- Sign Up
- Projects
  - Loading
  - Empty
  - Error
  - Project list
- Add Project
  - Desktop
  - Mobile
  - Validation/error states
- Edit Project design
- Authenticated desktop and mobile application shell
- Placeholder protected routes such as Epics, Tasks, Members, Details, and Statistics

The goal is to document components whose **purpose and behavior** are reusable across multiple screens.

Visual similarity alone is not considered enough reason to make a component shared.

---

## Shared Components

| #   | Component                 | Description                                                                                                           | Used In                                                                         | Screenshot                                                                                                                                                                                                                                             |
| --- | ------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Navbar                    | Top navigation for authenticated pages, including mobile menu access and authenticated user information               | All authenticated pages                                                         | [Desktop](https://www.figma.com/design/JKBfMPiHdHJVZmBa1Cttpo/Taskly--Tasks-Management---Copy-?node-id=44-2226&m=dev) / [Mobile](https://www.figma.com/design/JKBfMPiHdHJVZmBa1Cttpo/Taskly--Tasks-Management---Copy-?node-id=44-2461&m=dev)           |
| 2   | Authenticated Shell       | Shared responsive layout that composes desktop and mobile navigation around protected page content                    | All authenticated pages                                                         | [Desktop](https://www.figma.com/design/JKBfMPiHdHJVZmBa1Cttpo/Taskly--Tasks-Management---Copy-?node-id=44-2226&m=dev) / [Mobile](https://www.figma.com/design/JKBfMPiHdHJVZmBa1Cttpo/Taskly--Tasks-Management---Copy-?node-id=44-2461&m=dev)           |
| 3   | Desktop Sidebar           | Main desktop navigation with primary routes, active-project navigation, collapse behavior, and logout action          | All authenticated desktop pages                                                 | [Screenshot](https://www.figma.com/design/JKBfMPiHdHJVZmBa1Cttpo/Taskly--Tasks-Management---Copy-?node-id=44-2226&m=dev)                                                                                                                               |
| 4   | Mobile Navigation         | Mobile drawer and fixed bottom navigation used to access the authenticated application sections                       | All authenticated mobile pages                                                  | [Screenshot](https://www.figma.com/design/JKBfMPiHdHJVZmBa1Cttpo/Taskly--Tasks-Management---Copy-?node-id=44-2461&m=dev)                                                                                                                               |
| 5   | Button                    | Standard application action control with primary, secondary, and ghost variants                                       | Login, Sign Up, Project error state, Add Project, and other application actions | [Screenshot](https://www.figma.com/design/JKBfMPiHdHJVZmBa1Cttpo/Taskly--Tasks-Management---Copy-?node-id=44-2226&m=dev)                                                                                                                               |
| 6   | Input                     | Standard text input primitive supporting validation and application design tokens                                     | Login, Sign Up, Add Project, and Edit Project design                            | [Screenshot](https://www.figma.com/design/JKBfMPiHdHJVZmBa1Cttpo/Taskly--Tasks-Management---Copy-?node-id=44-2226&m=dev)                                                                                                                               |
| 7   | FieldLabel                | Reusable form label with shared typography and invalid-state styling                                                  | Login, Sign Up, Add Project, and Edit Project design                            | [Screenshot](https://www.figma.com/design/JKBfMPiHdHJVZmBa1Cttpo/Taskly--Tasks-Management---Copy-?node-id=44-2226&m=dev)                                                                                                                               |
| 8   | Textarea                  | Multi-line text control using the same surface, validation, and typography system as other form controls              | Add Project and Edit Project design                                             | [Screenshot](https://www.figma.com/design/JKBfMPiHdHJVZmBa1Cttpo/Taskly--Tasks-Management---Copy-?node-id=82-2099&m=dev)                                                                                                                               |
| 9   | Active Project Navigation | Navigation group for project-specific areas such as Epics, Tasks, Members, and Details                                | Desktop sidebar, collapsed sidebar popup, and mobile drawer                     | [Desktop](https://www.figma.com/design/JKBfMPiHdHJVZmBa1Cttpo/Taskly--Tasks-Management---Copy-?node-id=44-2226&m=dev) / [Mobile](https://www.figma.com/design/JKBfMPiHdHJVZmBa1Cttpo/Taskly--Tasks-Management---Copy-?node-id=44-2461&m=dev)           |
| 10  | Project Form Panel        | Reusable project metadata form structure containing title, description, character counter, actions, and form feedback | Add Project and Edit Project design                                             | [Add Project](https://www.figma.com/design/JKBfMPiHdHJVZmBa1Cttpo/Taskly--Tasks-Management---Copy-?node-id=44-2226&m=dev) / [Edit Project](https://www.figma.com/design/JKBfMPiHdHJVZmBa1Cttpo/Taskly--Tasks-Management---Copy-?node-id=82-2099&m=dev) |
| 11  | Page Header / Breadcrumb  | Desktop page context showing navigation hierarchy and the current page title                                          | Add Project and Edit Project design                                             | [Add Project](https://www.figma.com/design/JKBfMPiHdHJVZmBa1Cttpo/Taskly--Tasks-Management---Copy-?node-id=44-2226&m=dev) / [Edit Project](https://www.figma.com/design/JKBfMPiHdHJVZmBa1Cttpo/Taskly--Tasks-Management---Copy-?node-id=82-2099&m=dev) |
| 12  | Pro Tip Footer            | Supporting contextual information displayed below project forms                                                       | Add Project and Edit Project design                                             | [Screenshot](https://www.figma.com/design/JKBfMPiHdHJVZmBa1Cttpo/Taskly--Tasks-Management---Copy-?node-id=82-2099&m=dev)                                                                                                                               |

---

## Component Details

### Navbar

**Current component**

`src/components/shared/authenticated-layout/navbar.tsx`

The Navbar provides the persistent top-level header for authenticated pages.

It is reusable because its responsibility does not depend on the page content. It handles:

- authenticated user identity
- user initials
- job title
- mobile navigation trigger
- desktop and mobile responsive behavior

It is composed by the authenticated application shell rather than being implemented separately by individual pages.

---

### Authenticated Shell

**Current component**

`src/components/shared/authenticated-layout/authenticated-shell.tsx`

The Authenticated Shell is the shared responsive layout for protected application pages.

It composes:

- Desktop Sidebar
- Navbar
- Mobile Drawer
- page content
- Mobile Bottom Navigation

It is reusable because authentication-aware application framing and navigation should remain consistent across protected screens rather than being recreated by each page.

---

### Desktop Sidebar

**Current component**

`src/components/shared/authenticated-layout/desktop-sidebar.tsx`

The Desktop Sidebar is shared across authenticated desktop pages.

Its responsibilities include:

- primary navigation
- current route state
- active-project navigation
- collapsed and expanded variants
- logout
- sidebar collapse behavior

The navigation structure should stay centralized because all protected pages use the same application-level navigation.

---

### Mobile Navigation

**Current components**

- `src/components/shared/authenticated-layout/mobile-drawer.tsx`
- `src/components/shared/authenticated-layout/mobile-bottom-navigation.tsx`

These components provide the mobile equivalent of the desktop navigation system.

The drawer contains the full application navigation and logout action, while the bottom navigation provides persistent access to important project sections.

They are reusable because their behavior belongs to the authenticated application shell rather than to an individual screen.

---

### Button

**Current component**

`src/components/ui/button.tsx`

The Button is a shared UI primitive.

Current variants include:

- `primary`
- `secondary`
- `ghost`

The component is reused for actions such as authentication submission, retry actions, and project creation.

Individual screens may adjust dimensions or responsive styling through `className`, while the component keeps the common interaction and variant behavior centralized.

---

### Input

**Current component**

`src/components/ui/input.tsx`

The Input provides the base implementation for text-based form controls.

It centralizes:

- application surface colors
- foreground and placeholder colors
- transparent default border
- focus behavior
- `aria-invalid` validation styling

Screen-specific sizing and responsive styles can be passed through `className`.

This allows Login, Sign Up, project forms, and future forms to share the same semantic input foundation without forcing every input to have identical dimensions.

---

### FieldLabel

**Current component**

`src/components/ui/field-label.tsx`

FieldLabel provides the common form-label typography and validation behavior.

It supports:

- uppercase form label styling
- shared tracking and font weight
- normal state
- invalid/error state

It is used with multiple form controls rather than being tied to a particular form.

---

### Textarea

**Current component**

`src/components/ui/textarea.tsx`

Textarea is the multi-line equivalent of the Input primitive.

It shares the application's:

- surface system
- foreground colors
- placeholder styling
- validation styling
- focus behavior

The Add Project implementation currently uses it for project descriptions, and the Edit Project design uses the same type of control.

The primitive should remain generic rather than containing project-specific behavior such as the `500` character limit.

---

### Active Project Navigation

**Current component**

`src/components/shared/authenticated-layout/active-project-navigation.tsx`

The component represents navigation inside the currently active project.

It supports multiple presentation variants:

- expanded desktop accordion
- collapsed desktop popup
- mobile drawer navigation

The shared behavior includes navigation to:

- Epics
- Tasks
- Members
- Details

The visual presentation changes depending on the shell state, but the navigation purpose remains the same.

---

### Project Form Panel

**Status**

Recommended reusable component identified from screen review.

The Add Project implementation and Edit Project design contain the same project metadata workflow:

- project title
- description
- optional-description indicator
- character counter
- validation feedback
- Back action
- primary submit action
- contextual footer

The differences are primarily configuration:

| Add Project            | Edit Project            |
| ---------------------- | ----------------------- |
| Initialize New Project | Edit Project            |
| Empty initial values   | Existing project values |
| Create Project         | Save Changes            |
| Create operation       | Update operation        |

This makes the form structure a strong reuse candidate if Edit Project or another project metadata screen is implemented later.

This task is documentation-only, so no extraction or refactoring is performed here.

---

### Page Header / Breadcrumb

**Status**

Recommended reusable component identified from screen review.

Desktop project-management screens use a similar page-context pattern:

- breadcrumb navigation
- current section
- page title

Examples:

`PROJECTS > ADD NEW PROJECT`

and:

`PROJECTS > PROJECT TITLE > EDIT`

The component would be reusable because the structure and navigation behavior are consistent while the breadcrumb items and title are data-driven.

The mobile designs may use a different presentation, so responsive behavior should remain configurable.

---

### Pro Tip Footer

**Status**

Recommended reusable component identified from screen review.

Both Add Project and Edit Project designs contain the same contextual footer:

> **Pro Tip:** You can invite project members and assign epics immediately after the initial creation process.

The content has the same purpose, visual treatment, and placement in both project forms.

If additional form screens use contextual guidance in the future, this pattern could support configurable content rather than being tied specifically to project creation.

---

## Existing Application Shell

The shared authenticated shell is already implemented in:

`src/components/shared/authenticated-layout/authenticated-shell.tsx`

It composes the application-level shared components:

```text
AuthenticatedShell
├── DesktopSidebar
├── Navbar
├── MobileDrawer
├── Page Content
└── MobileBottomNavigation
```
