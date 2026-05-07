import 'dotenv/config';
import { Client } from '@notionhq/client';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { WPActivity, AssigningRecord } from '../types/notion.types';

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export const notionWpService = {
  findWPById: async (wpId: string): Promise<WPActivity | null> => {
    const response = await notion.dataSources.query({
      data_source_id: process.env.WP_ACTIVITY_DS_ID!,
      filter: {
        property: 'ID',
        rich_text: { equals: wpId },
      },
    });

    const page = response.results
      .filter((p): p is PageObjectResponse => 'properties' in p)
      .at(0);

    if (!page) return null;

    const props = page.properties;

    const id =
      props['ID']?.type === 'rich_text'
        ? (props['ID'].rich_text[0]?.plain_text ?? null)
        : null;

    const wpName =
      props['Name']?.type === 'title'
        ? (props['Name'].title[0]?.plain_text ?? '')
        : '';

    const dueDate =
      props['End']?.type === 'date' ? (props['End'].date?.start ?? null) : null;

    const projectName =
      props['Projects']?.type === 'formula' &&
      props['Projects'].formula.type === 'string'
        ? (props['Projects'].formula.string ?? null)
        : null;

    const linkPage =
      props['Link This Page']?.type === 'formula' &&
      props['Link This Page'].formula.type === 'string'
        ? (props['Link This Page'].formula.string ?? null)
        : null;

    const assigneeName =
      props['Assignee Name']?.type === 'formula' &&
      props['Assignee Name'].formula.type === 'string'
        ? (props['Assignee Name'].formula.string ?? null)
        : null;

    const assigneeTelegramId =
      props['Assignee Tele ID']?.type === 'formula' &&
      props['Assignee Tele ID'].formula.type === 'string'
        ? (props['Assignee Tele ID'].formula.string ?? null)
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

    return {
      id: id ?? wpId,
      notionPageId: page.id.replace(/-/g, ''),
      wpName,
      dueDate,
      projectName,
      linkPage,
      assigneeName,
      assigneeTelegramId,
      pmName,
      pmTelegramId,
    };
  },

  findAssigningByWpId: async (
    wpId: string,
  ): Promise<AssigningRecord | null> => {
    const response = await notion.dataSources.query({
      data_source_id: process.env.ASSIGNING_DS_ID!,
      filter: {
        property: 'ID',
        rich_text: { equals: wpId },
      },
    });

    const page = response.results
      .filter((p): p is PageObjectResponse => 'properties' in p)
      .at(0);

    if (!page) return null;

    const props = page.properties;

    const respond =
      props['Responds']?.type === 'rich_text'
        ? (props['Responds'].rich_text[0]?.plain_text ?? null)
        : null;

    const assignedAt =
      props['Date']?.type === 'date'
        ? (props['Date'].date?.start ?? null)
        : null;

    return {
      notionPageId: page.id.replace(/-/g, ''),
      wpId,
      respond,
      assignedAt,
    };
  },

  findActivitiesByParentId: async (parentId: string) => {
    const response = await notion.dataSources.query({
      data_source_id: process.env.WP_ACTIVITY_DS_ID!,
      filter: {
        property: 'Parent ID',
        rich_text: { equals: parentId },
      },
    });

    // Log semua nama kolom dari row pertama
    // const first = response.results[0];
    // if (first && 'properties' in first) {
    //  console.log('📋 Kolom yang tersedia:', Object.keys(first.properties));
    //}

    return response.results
      .filter((p): p is PageObjectResponse => 'properties' in p)
      .map((page) => {
        const props = page.properties;

        const id =
          props['ID']?.type === 'rich_text'
            ? (props['ID'].rich_text[0]?.plain_text ?? null)
            : null;

        const activityName =
          props['Activity Clockify Name']?.type === 'formula' &&
          props['Activity Clockify Name'].formula.type === 'string'
            ? (props['Activity Clockify Name'].formula.string ?? null)
            : null;

        const assigneeTelegramId =
          props['Assignee Tele ID']?.type === 'formula' &&
          props['Assignee Tele ID'].formula.type === 'string'
            ? (props['Assignee Tele ID'].formula.string ?? null)
            : null;

        const assigneeName =
          props['Assignee Name']?.type === 'formula' &&
          props['Assignee Name'].formula.type === 'string'
            ? (props['Assignee Name'].formula.string ?? null)
            : null;

        const first = response.results[0];
        if (first && 'properties' in first) {
          console.log('Name type:', (first.properties['Name'] as any)?.type);
          console.log(
            'Activity type:',
            (first.properties['Activity'] as any)?.type,
          );
          console.log(
            'Activity Clockify Name type:',
            (first.properties['Activity Clockify Name'] as any)?.type,
          );
        }

        return {
          id,
          activityName,
          assigneeTelegramId,
          assigneeName,
        };
      });
  },

  createAssigning: async (data: { wpNotionPageId: string }) => {
    const response = await notion.pages.create({
      parent: { database_id: process.env.ASSIGNING_DATABASE_ID! },
      properties: {
        'Work Package-Activity': {
          type: 'relation',
          relation: [{ id: data.wpNotionPageId }],
        },
      },
    });
    return response.id.replace(/-/g, ''); // ← return notionPageId
  },

  updateAssigningRespond: async (notionPageId: string, respond: string) => {
    await notion.pages.update({
      page_id: notionPageId,
      properties: {
        Responds: {
          select: { name: respond },
        },
      },
    });
  },
};
