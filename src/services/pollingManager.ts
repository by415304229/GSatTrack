/**
 * 轮询管理器
 * 统一管理应用中的所有定时轮询任务
 */

/**
 * 轮询任务接口
 */
interface PollingTask {
  id: string;
  fn: () => Promise<void>;
  interval: number;
  lastRun: number;
  enabled: boolean;
}

class PollingManager {
  private static instance: PollingManager;
  private tasks = new Map<string, PollingTask>();
  private timerId: number | null = null;
  private isRunning = false;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): PollingManager {
    if (!PollingManager.instance) {
      PollingManager.instance = new PollingManager();
    }
    return PollingManager.instance;
  }

  /**
   * 注册轮询任务
   * @param id 任务 ID
   * @param fn 执行函数
   * @param interval 轮询间隔（毫秒）
   * @param autoStart 是否自动开始
   */
  register(id: string, fn: () => Promise<void>, interval: number, autoStart: boolean = true): void {
    console.log(`[PollingManager] 注册任务: ${id}, 间隔: ${interval}ms`);

    this.tasks.set(id, {
      id,
      fn,
      interval,
      lastRun: 0,
      enabled: autoStart
    });

    if (autoStart && !this.isRunning) {
      this.start();
    }
  }

  /**
   * 启动轮询
   */
  start(): void {
    if (this.isRunning) {
      console.log('[PollingManager] 轮询已在运行');
      return;
    }

    console.log('[PollingManager] 启动轮询');
    this.isRunning = true;
    this.tick();
  }

  /**
   * 停止轮询
   */
  stop(): void {
    console.log('[PollingManager] 停止轮询');
    this.isRunning = false;

    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * 轮询核心逻辑
   */
  private async tick(): Promise<void> {
    if (!this.isRunning) return;

    const now = Date.now();
    const tasksToRun: PollingTask[] = [];

    // 找出需要执行的任务
    for (const task of this.tasks.values()) {
      if (task.enabled && now - task.lastRun >= task.interval) {
        tasksToRun.push(task);
      }
    }

    // 并行执行任务
    if (tasksToRun.length > 0) {
      console.log(`[PollingManager] 执行 ${tasksToRun.length} 个任务`);

      await Promise.all(
        tasksToRun.map(async (task) => {
          try {
            await task.fn();
            task.lastRun = Date.now();
          } catch (error) {
            console.error(`[PollingManager] 任务 ${task.id} 执行失败:`, error);
          }
        })
      );
    }

    // 计算下一次执行时间
    if (this.isRunning) {
      const enabledTasks = Array.from(this.tasks.values()).filter(t => t.enabled);
      if (enabledTasks.length > 0) {
        const minInterval = Math.min(...enabledTasks.map(t => t.interval));
        this.timerId = window.setTimeout(() => this.tick(), minInterval);
      } else {
        console.log('[PollingManager] 没有启用的任务，停止轮询');
        this.stop();
      }
    }
  }

  /**
   * 启用/禁用任务
   * @param id 任务 ID
   * @param enabled 是否启用
   */
  setTaskEnabled(id: string, enabled: boolean): void {
    const task = this.tasks.get(id);
    if (task) {
      task.enabled = enabled;
      console.log(`[PollingManager] 任务 ${id} ${enabled ? '已启用' : '已禁用'}`);

      // 如果启用且轮询未运行，启动轮询
      if (enabled && !this.isRunning) {
        this.start();
      }
    }
  }

  /**
   * 更新任务间隔
   * @param id 任务 ID
   * @param interval 新的轮询间隔
   */
  setTaskInterval(id: string, interval: number): void {
    const task = this.tasks.get(id);
    if (task) {
      task.interval = interval;
      console.log(`[PollingManager] 任务 ${id} 间隔已更新为 ${interval}ms`);
    }
  }

  /**
   * 移除任务
   * @param id 任务 ID
   */
  unregister(id: string): void {
    this.tasks.delete(id);
    console.log(`[PollingManager] 移除任务: ${id}`);
  }

  /**
   * 清除所有任务
   */
  clear(): void {
    console.log('[PollingManager] 清除所有任务');
    this.stop();
    this.tasks.clear();
  }

  /**
   * 获取任务状态
   */
  getStatus(): { id: string; enabled: boolean; interval: number; lastRun: number }[] {
    return Array.from(this.tasks.values()).map(task => ({
      id: task.id,
      enabled: task.enabled,
      interval: task.interval,
      lastRun: task.lastRun
    }));
  }
}

export default PollingManager;
