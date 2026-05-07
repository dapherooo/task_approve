-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "Assignment" (
    "id" SERIAL NOT NULL,
    "notionPageId" TEXT,
    "wpId" TEXT NOT NULL,
    "wpName" TEXT NOT NULL,
    "projectName" TEXT,
    "dueDate" TIMESTAMP(3),
    "linkPage" TEXT,
    "pmId" INTEGER NOT NULL,
    "assigneeId" INTEGER NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PMLog" (
    "id" SERIAL NOT NULL,
    "assignmentId" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT NOT NULL,

    CONSTRAINT "PMLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssigneeLog" (
    "id" SERIAL NOT NULL,
    "assignmentId" INTEGER NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT NOT NULL,
    "respond" TEXT,
    "respondAt" TIMESTAMP(3),

    CONSTRAINT "AssigneeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_notionPageId_key" ON "Assignment"("notionPageId");

-- CreateIndex
CREATE UNIQUE INDEX "PMLog_assignmentId_key" ON "PMLog"("assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "AssigneeLog_assignmentId_key" ON "AssigneeLog"("assignmentId");

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_pmId_fkey" FOREIGN KEY ("pmId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PMLog" ADD CONSTRAINT "PMLog_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssigneeLog" ADD CONSTRAINT "AssigneeLog_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
