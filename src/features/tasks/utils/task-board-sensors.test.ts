import { describe, expect, it, vi } from 'vitest';
import { PointerActivationConstraints } from '@dnd-kit/dom';
import { BoardKeyboardSensor, boardKeyboardSensor, boardPointerSensor } from './task-board-sensors';

const projectId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
class TestKeyboardSensor extends BoardKeyboardSensor {
  navigate(direction: 'up' | 'down' | 'left' | 'right', event: KeyboardEvent) {
    this.handleMove(direction, event);
  }
}

describe('Board sensors', () => {
  it('reserves Enter for details when idle and retains drop and cancel keys while dragging', () => {
    expect(boardKeyboardSensor.plugin).toBe(BoardKeyboardSensor);
    expect(boardKeyboardSensor.options?.keyboardCodes).toMatchObject({
      start: ['Space'],
      end: ['Space', 'Enter', 'Tab'],
      cancel: ['Escape'],
    });
  });
  it.each(['mouse', 'pen', 'touch'])(
    'uses the approved %s activation constraint',
    (pointerType) => {
      const constraints = boardPointerSensor.options?.activationConstraints;
      if (typeof constraints !== 'function')
        throw new Error('Expected pointer-specific constraints');
      const result = constraints(
        { pointerType } as PointerEvent,
        {} as Parameters<typeof constraints>[1],
      );
      expect(result).toHaveLength(1);
      const constraint = result?.[0];
      expect(constraint).toBeInstanceOf(
        pointerType === 'touch'
          ? PointerActivationConstraints.Delay
          : PointerActivationConstraints.Distance,
      );
      expect(constraint).toEqual(
        expect.objectContaining({
          options: pointerType === 'touch' ? { value: 250, tolerance: 5 } : { value: 8 },
        }),
      );
    },
  );

  it.each([false, true])(
    'snaps keyboard navigation to available status targets (Mobile: %s)',
    (mobile) => {
      const element = {
        scrollIntoView: vi.fn(),
        getBoundingClientRect: () => ({ left: 10, top: 20, width: 100, height: 44 }),
      };
      const move = vi.fn();
      const setDropTarget = vi.fn();
      const preventDefault = vi.fn();
      const sensor: TestKeyboardSensor = Object.create(TestKeyboardSensor.prototype);
      Object.defineProperty(sensor, 'manager', {
        value: {
          dragOperation: {
            source: {
              data: {
                projectId,
                taskId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
                title: 'Task',
                sourceStatus: 'TO_DO',
                canEdit: true,
                mobile,
              },
            },
          },
          registry: {
            droppables: [
              {
                id: 'disabled',
                data: { projectId, status: 'IN_PROGRESS', available: true },
                disabled: true,
                element,
              },
              {
                id: 'blocked',
                data: { projectId, status: 'BLOCKED', available: true },
                disabled: false,
                element,
              },
            ],
          },
          actions: { move, setDropTarget },
        },
      });
      const event = { preventDefault } as unknown as KeyboardEvent;
      sensor.navigate(mobile ? 'down' : 'right', event);
      expect(preventDefault).toHaveBeenCalledOnce();
      expect(element.scrollIntoView).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
        behavior: 'instant',
      });
      expect(move).toHaveBeenCalledWith({ to: { x: 60, y: 42 }, event });
      expect(setDropTarget).toHaveBeenCalledWith('blocked');
    },
  );
});
