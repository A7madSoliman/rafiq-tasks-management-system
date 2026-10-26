'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { parseContentRangeTotal } from '@/features/projects/utils/parse-content-range';

import type { TaskStatus } from '../constants/task-statuses';
import { createdTaskSchema, type CreatedTask } from '../schemas/created-task-schema';
import { mergeTaskPage } from '../utils/merge-task-page';
import {
  buildTaskPageParams,
  createTaskQueryKey,
  normalizeTaskSearchTerm,
} from '../utils/project-task-search-query';

type LoadStatus = 'loading' | 'success' | 'error';
type RequestMode = 'initial' | 'more';

type PaginationState = {
  canEdit: boolean | null;
  queryKey: string;
  tasks: CreatedTask[];
  totalCount: number | null;
  nextOffset: number;
  status: LoadStatus;
  isLoadingMore: boolean;
  loadMoreError: boolean;
};

const PAGE_SIZE = 10;

function createInitialState(queryKey: string): PaginationState {
  return {
    canEdit: null,
    queryKey,
    tasks: [],
    totalCount: null,
    nextOffset: 0,
    status: 'loading',
    isLoadingMore: false,
    loadMoreError: false,
  };
}

export function usePaginatedProjectTasks(
  projectId: string,
  statusFilter: TaskStatus | null = null,
  enabled = true,
  searchTerm = '',
  refreshRevision = 0,
) {
  const router = useRouter();

  const normalizedSearchTerm = normalizeTaskSearchTerm(searchTerm);

  const queryKey = JSON.stringify([
    createTaskQueryKey(projectId, statusFilter, normalizedSearchTerm),
    refreshRevision,
  ]);

  const [state, setState] = useState<PaginationState>(() => createInitialState(queryKey));

  const controllerRef = useRef<AbortController | null>(null);
  const loadMoreInFlightRef = useRef(false);
  const lastRequestedMoreOffsetRef = useRef<number | null>(null);
  const generationRef = useRef(0);

  /**
   * Fetch exactly one page for the current
   * project + status + search combination.
   */
  const fetchPage = useCallback(
    async (offset: number, mode: RequestMode, controller: AbortController, generation: number) => {
      const isActive = () => !controller.signal.aborted && generationRef.current === generation;

      const isCurrentState = (current: PaginationState) =>
        current.queryKey === queryKey && generationRef.current === generation;

      try {
        const params = buildTaskPageParams({
          limit: PAGE_SIZE,
          offset,
          statusFilter,
          searchTerm: normalizedSearchTerm,
        });

        const response = await fetch(
          `/api/projects/${encodeURIComponent(projectId)}/tasks?${params.toString()}`,
          {
            method: 'GET',
            signal: controller.signal,
            cache: 'no-store',
          },
        );

        if (!isActive()) {
          return;
        }

        const permission = response.headers.get('X-Taskly-Can-Edit');
        const canEdit =
          response.ok || response.status === 416
            ? permission === 'true'
              ? true
              : permission === 'false'
                ? false
                : null
            : null;
        setState((current) =>
          isCurrentState(current) && current.canEdit !== canEdit
            ? { ...current, canEdit }
            : current,
        );

        if (response.status === 401) {
          router.replace('/login');
          router.refresh();
          return;
        }

        const totalCount = parseContentRangeTotal(response.headers.get('content-range'));

        /**
         * Supabase may return 416 when data changes
         * while loading additional pages.
         */
        if (response.status === 416) {
          if (mode !== 'more' || totalCount === null) {
            throw new Error('Invalid pagination range.');
          }

          setState((current) => {
            if (!isCurrentState(current)) {
              return current;
            }

            return {
              ...current,
              totalCount,
              nextOffset: totalCount,
              isLoadingMore: false,
              loadMoreError: false,
            };
          });

          return;
        }

        if (!response.ok || totalCount === null) {
          throw new Error('Unable to load task page.');
        }

        const data: unknown = await response.json().catch(() => null);

        if (!isActive()) {
          return;
        }

        const parsed = createdTaskSchema.array().safeParse(data);

        if (
          !parsed.success ||
          parsed.data.length > PAGE_SIZE ||
          parsed.data.some(
            (task) =>
              task.project_id !== projectId ||
              (statusFilter !== null && task.status !== statusFilter),
          )
        ) {
          throw new Error('Invalid task page.');
        }

        const page = parsed.data;

        /**
         * A missing page should not trigger
         * endless requests for the same offset.
         */
        if (page.length === 0 && offset < totalCount) {
          throw new Error('Incomplete task page.');
        }

        setState((current) => {
          if (!isCurrentState(current)) {
            return current;
          }

          if (mode === 'initial') {
            const merged = mergeTaskPage([], page, 0);

            return {
              canEdit,
              queryKey,
              tasks: merged.tasks,
              totalCount,
              nextOffset: merged.nextOffset,
              status: 'success',
              isLoadingMore: false,
              loadMoreError: false,
            };
          }

          /**
           * Reject pages belonging to an outdated offset.
           */
          if (current.nextOffset !== offset) {
            return current;
          }

          const merged = mergeTaskPage(current.tasks, page, offset);

          return {
            ...current,
            tasks: merged.tasks,
            totalCount,
            nextOffset: merged.nextOffset,
            status: 'success',
            isLoadingMore: false,
            loadMoreError: false,
          };
        });
      } catch {
        if (!isActive()) {
          return;
        }

        setState((current) => {
          if (!isCurrentState(current)) {
            return current;
          }

          if (mode === 'more') {
            return {
              ...current,
              isLoadingMore: false,
              loadMoreError: true,
            };
          }

          return {
            ...createInitialState(queryKey),
            status: 'error',
          };
        });
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null;
          loadMoreInFlightRef.current = false;
        }
      }
    },
    [projectId, queryKey, router, statusFilter, normalizedSearchTerm],
  );

  /**
   * Reset pagination and load the first page.
   *
   * Runs when project, status, search, or
   * enabled state changes.
   */
  const startInitialLoad = useCallback(() => {
    generationRef.current += 1;

    controllerRef.current?.abort();
    controllerRef.current = null;

    loadMoreInFlightRef.current = false;
    lastRequestedMoreOffsetRef.current = null;

    setState(createInitialState(queryKey));

    if (!enabled || !projectId) {
      return;
    }

    const controller = new AbortController();

    controllerRef.current = controller;

    void fetchPage(0, 'initial', controller, generationRef.current);
  }, [enabled, fetchPage, projectId, queryKey]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    startInitialLoad();

    return () => {
      generationRef.current += 1;

      controllerRef.current?.abort();
      controllerRef.current = null;

      loadMoreInFlightRef.current = false;
    };
  }, [startInitialLoad]);

  /**
   * Never expose tasks from a different query.
   * This also prevents stale results appearing
   * before the effect starts a new request.
   */
  const isCurrentQuery = state.queryKey === queryKey;

  const currentState = isCurrentQuery ? state : createInitialState(queryKey);

  const hasMore =
    enabled &&
    currentState.status === 'success' &&
    currentState.totalCount !== null &&
    currentState.nextOffset < currentState.totalCount;

  /**
   * Load one additional page.
   * Duplicate offsets and concurrent requests
   * are rejected.
   */
  const requestMore = useCallback(
    (retryFailure: boolean) => {
      if (
        !enabled ||
        !projectId ||
        state.queryKey !== queryKey ||
        state.status !== 'success' ||
        state.totalCount === null ||
        state.nextOffset >= state.totalCount ||
        state.isLoadingMore ||
        (state.loadMoreError && !retryFailure) ||
        (!retryFailure && state.nextOffset === lastRequestedMoreOffsetRef.current) ||
        loadMoreInFlightRef.current ||
        controllerRef.current !== null
      ) {
        return;
      }

      const offset = state.nextOffset;

      loadMoreInFlightRef.current = true;

      const controller = new AbortController();

      controllerRef.current = controller;

      setState((current) => {
        if (current.queryKey !== queryKey) {
          return current;
        }

        return {
          ...current,
          isLoadingMore: true,
          loadMoreError: false,
        };
      });

      lastRequestedMoreOffsetRef.current = offset;

      void fetchPage(offset, 'more', controller, generationRef.current);
    },
    [enabled, fetchPage, projectId, queryKey, state],
  );

  const loadMore = useCallback(() => {
    requestMore(false);
  }, [requestMore]);

  const retryLoadMore = useCallback(() => {
    requestMore(true);
  }, [requestMore]);

  return {
    canEdit: currentState.status === 'success' ? currentState.canEdit : null,
    tasks: currentState.tasks,
    totalCount: currentState.totalCount ?? 0,
    status: currentState.status,
    hasMore,
    isLoadingMore: currentState.isLoadingMore,
    loadMoreError: currentState.loadMoreError,
    loadMore,
    retry: startInitialLoad,
    retryLoadMore,
  };
}
