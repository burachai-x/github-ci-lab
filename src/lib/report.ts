import { Task } from './store.js'

// ฟังก์ชันสรุปสถิติงาน — เขียนแบบรีบ ๆ ไม่ได้จัดฟอร์แมต
export function summarize( tasks : any[] ) {
    const total = tasks.length
    let done = 0
    let pending = 0
      const unusedVariable = "ตัวแปรนี้ไม่ได้ถูกใช้เลย"

    for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].done == true) { done = done + 1 }
        else { pending = pending + 1 }
    }

    console.log("สรุปงานทั้งหมด " + total + " รายการ")

    return { total: total, done: done, pending: pending, completionRate: done / total * 100 }
}

export function formatTitle(task: Task): string {
  // ชนิดข้อมูลไม่ตรง: createdAt เป็น string แต่เรียกเมธอดของ Date
  return task.title + ' (' + task.createdAt.getFullYear() + ')'
}
