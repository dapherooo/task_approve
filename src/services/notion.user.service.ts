import 'dotenv/config';
import { Client } from '@notionhq/client';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export const notionUserService = {
  getUsers: async () => {
    const response = await notion.dataSources.query({
      data_source_id: process.env.USER_DS_ID!,
    });

    return response.results
      .filter((page): page is PageObjectResponse => 'properties' in page)
      .map((page) => {
        const props = page.properties;

        const name =
          props['name']?.type === 'title'
            ? (props['name'].title[0]?.plain_text ?? null)
            : null;

        const notionEmail =
          props['notion email']?.type === 'rich_text'
            ? (props['notion email'].rich_text[0]?.plain_text ?? null)
            : null;

        const telegramId =
          props['telegram id']?.type === 'rich_text'
            ? (props['telegram id'].rich_text[0]?.plain_text ?? null)
            : null;

        const employeeId =
          props['employee id']?.type === 'rich_text'
            ? (props['employee id'].rich_text[0]?.plain_text ?? null)
            : null;

        return {
          notionUserId: page.id.replace(/-/g, ''),
          name,
          notionEmail,
          telegramId,
          employeeId,
        };
      });
  },
};
