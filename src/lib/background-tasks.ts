import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { logActivity } from './db';

export const FEED_SYNC_TASK = 'feed-sync-task';

/**
 * Defines the background worker at module scope. Must be imported from the
 * root layout so that the task exists even when the app is launched headless.
 */
export function defineBackgroundTasks() {
  if (TaskManager.isTaskDefined(FEED_SYNC_TASK)) return;

  TaskManager.defineTask(FEED_SYNC_TASK, async () => {
    try {
      // Simulates a periodic feed sync: hit the network, then record the run.
      const response = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5');
      const items = (await response.json()) as unknown[];
      await logActivity('background-sync', `Fetched ${items.length} items in the background`);
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch (error) {
      await logActivity('background-sync', `Failed: ${String(error)}`);
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

export async function registerFeedSync(): Promise<void> {
  await BackgroundTask.registerTaskAsync(FEED_SYNC_TASK, { minimumInterval: 15 });
  await logActivity('background-sync', 'Registered feed sync task');
}

export async function unregisterFeedSync(): Promise<void> {
  await BackgroundTask.unregisterTaskAsync(FEED_SYNC_TASK);
  await logActivity('background-sync', 'Unregistered feed sync task');
}

export async function isFeedSyncRegistered(): Promise<boolean> {
  return TaskManager.isTaskRegisteredAsync(FEED_SYNC_TASK);
}

export async function backgroundTaskStatus(): Promise<BackgroundTask.BackgroundTaskStatus | null> {
  return BackgroundTask.getStatusAsync();
}
