import { readFileSync } from 'fs';
import { gmail_v1, google } from 'googleapis';
// support for typescript debugging (refers to ts files instead of the transpiled js files)
import * as sourceMapSupport from 'source-map-support';
import { formatMessage } from './formatMessage';
import { authorizeAccount } from './GoogleAuthorizer';
import { Label } from './Label.interface';
import { SearchQuery } from './SearchQuery.interface';
sourceMapSupport.install();

// unhandled rejections are untraceable with no stacktrace, this adds stacktraces.
process.on('unhandledRejection', console.log);

export interface Message {
  messageId: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  historyId: string;
  /**
   * unix ms timestamp string
   */
  internalDate: string;
  headers: any[];
  body: {
    html: string | undefined;
    text: string | undefined;
  };
}

export class Inbox {
  private gmailApi: gmail_v1.Gmail;
  constructor(private credentialsJsonPath: string, private tokenPath = 'gmail-token.json') {
    this.gmailApi = this.authenticateAccount(credentialsJsonPath, tokenPath);
  }

  public async getAllLabels(): Promise<Label[]> {
    return new Promise((resolve, reject) => {
      this.gmailApi.users.labels.list(
        {
          userId: 'me',
        },
        (errorMessage, result) => {
          if (errorMessage) {
            reject(errorMessage);
            return;
          }

          resolve(result?.data.labels);
        },
      );
    });
  }

  /**
   * Retrieves all existing emails
   */
  public async getInboxMessages(): Promise<Message[]> {
    try {
      const messages = await this.findMessages({
        labels: ['inbox'],
      } as SearchQuery);

      if (messages && messages !== undefined) {
        return messages;
      } else {
        return [];
      }
    } catch (e) {
      console.log('gmail-inbox error:', e);
      return [];
    }
  }

  /**
   * Finds existing emails
   *
   * Example search query
   * - "has:attachment filename:salary.pdf largerThan:1000000 label:(paychecks salaries) from:myoldcompany@oldcompany.com"
   * - {
   *   has: "attachment",
   *   filename: "salary.pdf",
   *   largerThanInBytes: 1000000,
   *   labels: ["paychecks", "salaries"],
   *   from: "myoldcompany@oldcompany.com"
   * }
   */
  public findMessages(searchQuery: SearchQuery | string | undefined): Promise<Message[]> {
    return new Promise((resolve, reject) => {
      let searchString: string | undefined;
      if (typeof searchQuery === 'string' || searchQuery === undefined) {
        searchString = searchQuery;
      } else {
        searchString = this.mapSearchQueryToSearchString(searchQuery);
      }

      const query: any = {
        userId: 'me',
      };
      if (searchString) {
        query.q = searchString;
      }
      this.gmailApi.users.messages.list(query, async (errorMessage, result) => {
        if (errorMessage) {
          reject(errorMessage);
          return;
        }

        const gmailMessages: gmail_v1.Schema$Message[] | undefined = result?.data.messages;
        if (!gmailMessages) {
          return resolve([]);
        }

        const messages: gmail_v1.Schema$Message[] = await Promise.all(
          gmailMessages.map(
            async (message: gmail_v1.Schema$Message): Promise<any> => {
              if (message.id) {
                return this.getMessageById(message.id);
              }
              return null;
            },
          ),
        );

        messages.filter(message => !!message === true);

        resolve(messages as any);
      });
    });
  }

  private authenticateAccount(credentialsJsonPath: string, tokenPath: string) {
    const oAuthClient = authorizeAccount(credentialsJsonPath, tokenPath);
    return google.gmail({ version: 'v1', auth: oAuthClient });
  }

  private async getMessageById(messageId: string): Promise<Message> {
    return new Promise((resolve, reject) => {
      this.gmailApi.users.messages.get(
        {
          format: 'full',
          id: messageId,
          userId: 'me',
        },
        (errorMessage, message) => {
          if (errorMessage) {
            reject(errorMessage);
          } else {
            resolve(formatMessage(message as any) as Message);
          }
        },
      );
    });
  }

  private arrayToAdvancedSearchString(itemOrItems: string[] | string) {
    if (typeof itemOrItems === 'string') {
      return itemOrItems;
    }

    return `(${itemOrItems.join(' ')})`;
  }

  private mapSearchQueryToSearchString(searchQuery: SearchQuery): string {
    let searchString: string = '';

    if (searchQuery.message) {
      searchString += searchQuery.message;
    }

    if (searchQuery.subject) {
      searchString += `subject: ${this.arrayToAdvancedSearchString(searchQuery.subject)}`;
    }

    if (searchQuery.mustContainText) {
      searchString += ` "${searchQuery.mustContainText}"`;
    }

    if (searchQuery.from) {
      searchString += ` from: ${this.arrayToAdvancedSearchString(searchQuery.from)}`;
    }

    if (searchQuery.to) {
      searchString += ` to: ${this.arrayToAdvancedSearchString(searchQuery.to)}`;
    }

    if (searchQuery.cc) {
      searchString += ` cc: ${searchQuery.cc}`;
    }

    if (searchQuery.bcc) {
      searchString += ` bcc: ${searchQuery.bcc}`;
    }

    if (searchQuery.labels) {
      searchString += ` label: ${this.arrayToAdvancedSearchString(searchQuery.labels)}`;
    }

    if (searchQuery.has) {
      searchString += ` has: ${searchQuery.has}`;
    }

    if (searchQuery.filenameExtension) {
      searchString += ` filename: ${searchQuery.filenameExtension}`;
    }

    if (searchQuery.filename) {
      searchString += ` filename: ${searchQuery.filename}`;
    }

    if (searchQuery.is) {
      searchString += ` is: ${searchQuery.is}`;
    }

    return searchString;
  }
}
