import { prisma } from '../prisma/client';
import { SubmissionStatus } from '@prisma/client';
import { CreateSubmissionData } from '../types/notion.types';

export const submissionRepository = {
  findByNotionPageId: (notionPageId: string) => {
    return prisma.submission.findUnique({
      where: { notionPageId },
      include: { assignee: true, user: true, pm: true },
    });
  },

  create: (data: CreateSubmissionData) => {
    return prisma.submission.create({
      data,
      include: { assignee: true, user: true, pm: true },
    });
  },

  updateStatus: (id: number, status: SubmissionStatus) => {
    return prisma.submission.update({
      where: { id },
      data: { status },
    });
  },

  createAssigneeLog: (data: { submissionId: number; message: string }) => {
    return prisma.submissionAssigneeLog.create({ data });
  },

  createUserLog: (data: { submissionId: number; message: string }) => {
    return prisma.submissionUserLog.create({ data });
  },

  findUserLog: (submissionId: number) => {
    return prisma.submissionUserLog.findUnique({ where: { submissionId } });
  },

  updateUserLog: (
    submissionId: number,
    data: { respond: string; respondAt: Date; declineNotes?: string },
  ) => {
    return prisma.submissionUserLog.update({
      where: { submissionId },
      data,
    });
  },
};
