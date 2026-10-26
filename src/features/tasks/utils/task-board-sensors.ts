import { KeyboardSensor, PointerSensor, PointerActivationConstraints } from '@dnd-kit/dom';
import type { Draggable, KeyboardSensorOptions } from '@dnd-kit/dom';
import {
  boardDragSourceSchema,
  boardDropTargetSchema,
  getKeyboardTargetStatus,
} from './task-board-move-intent';

export const boardPointerSensor = PointerSensor.configure({
  activationConstraints(event) {
    return event.pointerType === 'touch'
      ? [new PointerActivationConstraints.Delay({ value: 250, tolerance: 5 })]
      : [new PointerActivationConstraints.Distance({ value: 8 })];
  },
});

// Retain the library's activation/end/cancel behavior; replace only pixel navigation.
export class BoardKeyboardSensor extends KeyboardSensor {
  protected handleStart(
    event: KeyboardEvent,
    source: Draggable,
    options: KeyboardSensorOptions | undefined,
  ) {
    super.handleStart(event, source, options);
    if (!this.manager.dragOperation.status.idle) this.manager.collisionObserver.disable();
  }

  protected handleMove(direction: 'up' | 'down' | 'left' | 'right', event: KeyboardEvent) {
    const { source, target } = this.manager.dragOperation;
    const from = boardDragSourceSchema.safeParse(source?.data);
    if (!from.success) return;
    event.preventDefault();
    const targets = Array.from(this.manager.registry.droppables).flatMap((droppable) => {
      const parsed = boardDropTargetSchema.safeParse(droppable.data);
      return parsed.success &&
        !droppable.disabled &&
        droppable.element &&
        parsed.data.projectId === from.data.projectId
        ? [{ droppable, status: parsed.data.status }]
        : [];
    });
    const current = boardDropTargetSchema.safeParse(target?.data);
    const next = getKeyboardTargetStatus(
      current.success ? current.data.status : from.data.sourceStatus,
      direction,
      from.data.mobile,
      new Set(targets.map((entry) => entry.status)),
    );
    const destination = targets.find((entry) => entry.status === next)?.droppable;
    if (!destination?.element) return;
    destination.element.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: 'instant',
    });
    const rect = destination.element.getBoundingClientRect();
    this.manager.actions.move({
      to: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
      event,
    });
    void this.manager.actions.setDropTarget(destination.id);
  }

  protected cleanup() {
    this.manager.collisionObserver.enable();
    super.cleanup();
  }
}

// The inherited configure() factory binds the base KeyboardSensor class.
// Keep our status-target navigation by supplying the subclass explicitly.
export const boardKeyboardSensor = {
  plugin: BoardKeyboardSensor,
  options: {
    keyboardCodes: {
      ...KeyboardSensor.defaults.keyboardCodes,
      start: ['Space'],
    },
  },
};
