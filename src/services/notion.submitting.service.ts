import 'dotenv/config';
import { Client } from '@notionhq/client';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { SubmissionData } from '../types/notion.types';

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export const notionSubmittingService = {
  getSubmissionByPageId: async (
    pageId: string,
  ): Promise<SubmissionData | null> => {
    const page = await notion.pages.retrieve({ page_id: pageId });

    if (!('properties' in page)) return null;

    const props = (page as PageObjectResponse).properties;

    const wpName =
      props['WP / Task']?.type === 'rich_text'
        ? (props['WP / Task'].rich_text[0]?.plain_text ?? '')
        : '';

    const projectName =
      props['Project']?.type === 'formula' &&
      props['Project'].formula.type === 'string'
        ? (props['Project'].formula.string ?? null)
        : null;

    const submittedDate =
      props['Submitted Date']?.type === 'date'
        ? (props['Submitted Date'].date?.start ?? null)
        : null;

    const pageLink =
      props['Page Link']?.type === 'formula' &&
      props['Page Link'].formula.type === 'string'
        ? (props['Page Link'].formula.string ?? null)
        : null;

    const assigneeName =
      props['Assignee Name']?.type === 'formula' &&
      props['Assignee Name'].formula.type === 'string'
        ? (props['Assignee Name'].formula.string ?? null)
        : null;

    const assigneeTelegramId =
      props['Assignee Telegram ID']?.type === 'formula' &&
      props['Assignee Telegram ID'].formula.type === 'string'
        ? (props['Assignee Telegram ID'].formula.string ?? null)
        : null;

    const userName =
      props['User Name']?.type === 'formula' &&
      props['User Name'].formula.type === 'string'
        ? (props['User Name'].formula.string ?? null)
        : null;

    const userTelegramId =
      props['User Telegram ID']?.type === 'formula' &&
      props['User Telegram ID'].formula.type === 'string'
        ? (props['User Telegram ID'].formula.string ?? null)
        : null;

    const pmName =
      props['PM Name']?.type === 'formula' &&
      props['PM Name'].formula.type === 'string'
        ? (props['PM Name'].formula.string ?? null)
        : null;

    const pmTelegramId =
      props['PM Telegram ID']?.type === 'formula' &&
      props['PM Telegram ID'].formula.type === 'string'
        ? (props['PM Telegram ID'].formula.string ?? null)
        : null;

    const deliverableName =
      props['Deliverable Name']?.type === 'rich_text'
        ? (props['Deliverable Name'].rich_text[0]?.plain_text ?? null)
        : null;

    return {
      notionPageId: page.id.replace(/-/g, ''),
      wpName,
      projectName,
      submittedDate,
      pageLink,
      deliverableName, // ← tambah
      assigneeName,
      assigneeTelegramId,
      userName,
      userTelegramId,
      pmName,
      pmTelegramId,
    };
  },

  updateRespond: async (pageId: string, respond: string) => {
    await notion.pages.update({
      page_id: pageId,
      properties: {
        Responds: {
          select: { name: respond },
        },
      },
    });
  },

  updateApprovalDate: async (pageId: string, date: Date) => {
    await notion.pages.update({
      page_id: pageId,
      properties: {
        'Approval Date': {
          date: { start: date.toISOString() },
        },
      },
    });
  },

  updateDeclineNotes: async (pageId: string, notes: string) => {
    await notion.pages.update({
      page_id: pageId,
      properties: {
        'Decline Notes': {
          rich_text: [{ type: 'text', text: { content: notes } }],
        },
      },
    });
  },
};
