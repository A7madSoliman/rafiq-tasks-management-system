# Shared components

[Back to Taskly](../README.md)

Taskly shares components when their behavior and purpose span multiple screens. Feature-specific forms and dialogs stay within their feature directories; visual similarity alone does not require a shared abstraction.

## Authenticated application shell

The [AuthenticatedShell](../src/components/shared/authenticated-layout/authenticated-shell.tsx) wraps protected page content and composes the responsive navigation:

```text
AuthenticatedShell
  DesktopSidebar
  Navbar
  MobileDrawer
  Page content
  MobileBottomNavigation
```

| Component                                                                                              | Responsibility                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Navbar](../src/components/shared/authenticated-layout/navbar.tsx)                                     | User identity, initials, job title, and mobile menu trigger.                                                                                                                  |
| [DesktopSidebar](../src/components/shared/authenticated-layout/desktop-sidebar.tsx)                    | Primary navigation, active route state, expanded/collapsed presentation, project navigation, and logout.                                                                      |
| [MobileDrawer](../src/components/shared/authenticated-layout/mobile-drawer.tsx)                        | Full navigation and logout on mobile; focus containment while open, Escape dismissal, focus restoration, and inert content while closed.                                      |
| [MobileBottomNavigation](../src/components/shared/authenticated-layout/mobile-bottom-navigation.tsx)   | Persistent mobile access to project sections and the projects list.                                                                                                           |
| [ActiveProjectNavigation](../src/components/shared/authenticated-layout/active-project-navigation.tsx) | Project navigation in the expanded sidebar, collapsed popup, and mobile drawer. Epics, Tasks, Members, and Details link to implemented routes; Details opens project editing. |
| [SessionRestore](../src/components/shared/authenticated-layout/session-restore.tsx)                    | Refreshes an expired session through the server API before protected content is rendered.                                                                                     |

Navigation definitions live in [src/config/navigation.ts](../src/config/navigation.ts). Session verification belongs to the [protected server layout](../src/app/%28protected%29/layout.tsx) and [auth utilities](../src/lib/auth/session.ts), rather than individual navigation components.

## UI primitives

| Component                                          | Shared behavior                                                                                                                                |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| [Button](../src/components/ui/button.tsx)          | Native button props with `primary`, `secondary`, and `ghost` variants. Defaults to `type="button"`; submit controls opt in to `type="submit"`. |
| [Input](../src/components/ui/input.tsx)            | Native input props, a forwarded ref, design-token styling, and `aria-invalid` styling.                                                         |
| [FieldLabel](../src/components/ui/field-label.tsx) | Native label props, shared typography, and an `invalid` styling flag.                                                                          |
| [Textarea](../src/components/ui/textarea.tsx)      | Native textarea props, a forwarded ref, design-token styling, and `aria-invalid` styling.                                                      |

These primitives accept `className` for screen-specific dimensions and responsive presentation. [cn](../src/lib/cn.ts) uses `tailwind-merge` to resolve conflicting utility classes. Colors, spacing, and other shared values live in [tokens.css](../src/styles/tokens.css) and are integrated through [globals.css](../src/app/globals.css).

Form owners connect labels and validation messages with `htmlFor`, control IDs, and `aria-describedby`. They supply registration, validation, and submission behavior; primitives do not own API calls or business rules.

## Shared project fields

[ProjectFormFields](../src/features/projects/components/project-form-fields.tsx) is implemented and reused by both [CreateProjectForm](../src/features/projects/components/create-project-form.tsx) and [EditProjectForm](../src/features/projects/components/edit-project-form.tsx). It contains:

- The required project title input and optional description textarea.
- Field-level validation messages and their accessibility associations.
- The description character counter and 500-character input limit.
- Responsive field spacing and typography.

React Hook Form registration objects, errors, and the current description length are passed in. Create and edit forms retain their own defaults, API operations, pending states, actions, and submission feedback. The edit screen loads existing project values into the shared fields.

## Patterns kept within their screens

Project forms use similar panels, page headers/breadcrumbs, and contextual Pro Tip footers. The implementation shares the form fields, while the surrounding layout, breadcrumbs, actions, and footer remain in the create/edit forms. These patterns can be considered for extraction if additional screens need the same behavior; they are not separate shared components today.

Loading, empty, and error states remain feature-specific, allowing project lists, Epic lists, task boards, and statistics sections to keep appropriate content and retry behavior. Task and Epic dialogs likewise keep their domain-specific editing and save behavior.

## Design reference

The original review referenced the [desktop/mobile shell design](https://www.figma.com/design/JKBfMPiHdHJVZmBa1Cttpo/Taskly--Tasks-Management---Copy-?node-id=44-2226) and [edit-project design](https://www.figma.com/design/JKBfMPiHdHJVZmBa1Cttpo/Taskly--Tasks-Management---Copy-?node-id=82-2099). These links are design references, not application screenshots.
