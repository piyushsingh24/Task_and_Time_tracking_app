-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "dueDate" TIMESTAMPTZ(6);

-- CreateIndex
CREATE INDEX "Task_userId_dueDate_idx" ON "Task"("userId", "dueDate");
