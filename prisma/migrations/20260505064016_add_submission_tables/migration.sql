-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('SUBMITTED', 'APPROVED', 'DECLINED');

-- CreateTable
CREATE TABLE "Submission" (
    "id" SERIAL NOT NULL,
    "notionPageId" TEXT NOT NULL,
    "wpName" TEXT NOT NULL,
    "projectName" TEXT,
    "submittedDate" TIMESTAMP(3),
    "pageLink" TEXT,
    "assigneeId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "pmId" INTEGER NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionAssigneeLog" (
    "id" SERIAL NOT NULL,
    "submissionId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionAssigneeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionUserLog" (
    "id" SERIAL NOT NULL,
    "submissionId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respond" TEXT,
    "respondAt" TIMESTAMP(3),
    "declineNotes" TEXT,

    CONSTRAINT "SubmissionUserLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Submission_notionPageId_key" ON "Submission"("notionPageId");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionAssigneeLog_submissionId_key" ON "SubmissionAssigneeLog"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionUserLog_submissionId_key" ON "SubmissionUserLog"("submissionId");

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_pmId_fkey" FOREIGN KEY ("pmId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionAssigneeLog" ADD CONSTRAINT "SubmissionAssigneeLog_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionUserLog" ADD CONSTRAINT "SubmissionUserLog_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
