export interface Task {
  id: string;
  title: string;
  owner: string;
  done: boolean;
  createdAt: string;
}

/**
 * ที่เก็บข้อมูลแบบ in-memory — ตั้งใจให้เรียบง่าย เพราะหัวใจของ repo นี้คือ pipeline
 * ไม่ใช่ตัวแอป แต่โครงสร้างยังเขียนแบบที่ปลอดภัยเพื่อใช้เทียบกับโค้ดเวอร์ชันที่จงใจทำพัง
 */
export class TaskStore {
  private readonly tasks = new Map<string, Task>();

  list(owner?: string): Task[] {
    const all = [...this.tasks.values()];
    return owner ? all.filter((task) => task.owner === owner) : all;
  }

  get(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  create(input: { title: string; owner: string }): Task {
    const task: Task = {
      id: crypto.randomUUID(),
      title: input.title,
      owner: input.owner,
      done: false,
      createdAt: new Date().toISOString(),
    };
    this.tasks.set(task.id, task);
    return task;
  }

  complete(id: string): Task | undefined {
    const task = this.tasks.get(id);
    if (!task) {
      return undefined;
    }
    const updated: Task = { ...task, done: true };
    this.tasks.set(id, updated);
    return updated;
  }
}
