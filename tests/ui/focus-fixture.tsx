import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Navbar } from '@/components/shared/authenticated-layout/navbar';
import { MobileDrawer } from '@/components/shared/authenticated-layout/mobile-drawer';
import { CurrentProjectProvider } from '@/features/projects/context/current-project-context';
import { EpicDetailsModal } from '@/features/epics/components/epic-details-modal';
import { TaskDetailsDialog } from '@/features/tasks/components/task-details-dialog';
import type { ProjectEpic } from '@/features/epics/types/project-epic';

const projectId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const taskId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const epic: ProjectEpic = {
  id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  projectId,
  epicId: 'EPIC-1',
  title: 'Browser focus regression',
  description: 'Original description',
  createdAt: '2026-10-27T00:00:00Z',
  deadline: null,
  createdBy: { userId: projectId, name: 'Reviewer', email: 'review@example.test', department: '' },
  assignee: null,
};

// Only the network boundary is replaced. Components, hooks, portals, effects,
// native inert/dialog behavior, and keyboard navigation run in Chromium.
const requests: unknown[] = [];
Object.assign(window, { requests });
window.fetch = async (input, init) => {
  const url = String(input);
  if (init?.method === 'PATCH') {
    requests.push(JSON.parse(String(init.body)));
    return new Response(null, { status: 204 });
  }
  const data = url.endsWith(`/tasks/${taskId}`)
    ? {
        id: taskId,
        projectId,
        taskCode: 'TASK-1',
        title: 'Nested task',
        description: null,
        status: 'TO_DO',
        epic: null,
        assigneeName: null,
        assigneeId: null,
        canEdit: false,
        createdByName: null,
        dueDate: null,
        createdAt: null,
      }
    : url.includes('/epics/') && url.endsWith('/tasks')
      ? [{ id: taskId, title: 'Nested task', dueDate: null, assigneeName: null }]
      : [];
  return Response.json(data);
};

function Fixture() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [epicOpen, setEpicOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [revision, setRevision] = useState(0);
  return (
    <CurrentProjectProvider>
      <Navbar user={null} onOpenMobileMenu={() => setDrawerOpen(true)} />
      <button id="outside" onClick={() => setRevision((value) => value + 1)}>
        Outside {revision}
      </button>
      <button id="open-epic" onClick={() => setEpicOpen(true)}>
        Open epic
      </button>
      <MobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        isLoggingOut={loggingOut}
        onLogout={async () => setLoggingOut(true)}
      />
      <EpicDetailsModal
        isOpen={epicOpen}
        epic={epic}
        status="success"
        errorMessage={null}
        onClose={() => setEpicOpen(false)}
        onAddTask={() => undefined}
        onTitleSaved={() => undefined}
        onAssigneeSaved={() => undefined}
        onDeadlineSaved={() => undefined}
        onTaskClick={() => setTaskOpen(true)}
        isTaskDetailsOpen={taskOpen}
      />
      <TaskDetailsDialog
        projectId={projectId}
        taskId={taskOpen ? taskId : null}
        onClose={() => setTaskOpen(false)}
      />
    </CurrentProjectProvider>
  );
}

createRoot(document.getElementById('root')!).render(<Fixture />);
