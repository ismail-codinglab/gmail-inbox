import { gmail_v1, google } from 'googleapis';
// support for typescript debugging (refers to ts files instead of the transpiled js files)
import * as sourceMapSupport from 'source-map-support';
import { formatMessage } from './formatMessage';
import { authorizeAccount } from './GoogleAuthorizer';
import { InboxMethods } from './InboxMethods.interface';
import { Label } from './Label.interface';
import { MessageDateType, SearchQuery, UnixTimestamp } from './SearchQuery.interface';
sourceMapSupport.install();

export interface Message {
  messageId: string;
  threadId: string;
  subject: string | undefined;
  from: string | undefined;
  to: string | undefined;
  receivedOn: string | undefined;
  labelIds: string[];
  snippet: string;
  historyId: string;
  /**
   * unix ms timestamp string
   */
  internalDate: string;
  getFullMessage: () => any;
  body: {
    html: string | undefined;
    text: string | undefined;
  };
}

export class Inbox implements InboxMethods {
  private gmailApi: gmail_v1.Gmail = google.gmail('v1');
  private authenticated: boolean = false;

  constructor(private credentialsJsonPath: string, private tokenPath = 'gmail-token.json') {}

  public async authenticateAccount(): Promise<void> {
    const oAuthClient = await authorizeAccount(this.credentialsJsonPath, this.tokenPath);
    this.gmailApi = google.gmail({ version: 'v1', auth: oAuthClient });
    this.authenticated = true;
  }

  public async getAllLabels(): Promise<Label[]> {
    this.guardAuthentication();
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
  public async getLatestMessages(): Promise<Message[]> {
    this.guardAuthentication();
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
    this.guardAuthentication();
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

      if(typeof searchQuery=='object' && searchQuery.maxResults){
        query.maxResults=searchQuery.maxResults
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

  /**
   *
   * @param searchQuery similar to findMessages, the query how it will find the message
   * @param timeTillNextCallInSeconds How long it should wait till it checks again if the message is received
   * @param maxWaitTimeInSeconds How long it should wait in total for the message
   */
  public waitTillMessage(
    searchQuery: SearchQuery | string | undefined,
    shouldLogEvents = true,
    timeTillNextCallInSeconds: number = 5,
    maxWaitTimeInSeconds: number = 60,
  ): Promise<Message[]> {
    return new Promise(async (resolve, reject) => {
      const waitTime = new Date();
      let timeDiffInSeconds = 0;
      this.log(shouldLogEvents, 'finding message based on SearchQuery:', searchQuery);
      let messages = await this.findMessages(searchQuery);

      while (!messages.length) {
        timeDiffInSeconds = (Date.now() - waitTime.getTime()) / 1000;
        if (timeDiffInSeconds && maxWaitTimeInSeconds - timeDiffInSeconds <= 0) {
          this.log(shouldLogEvents, 'Could not find message within time limit of searchQuery:', searchQuery);
          reject(`No message found for searchQuery: ${JSON.stringify(searchQuery)}`);
          return;
        }
        await this.timeout(timeTillNextCallInSeconds * 1000);
        this.log(shouldLogEvents, `${timeDiffInSeconds} seconds passed, trying again with SearchQuery:`, searchQuery);
        messages = await this.findMessages(searchQuery);
      }

      resolve(messages);
    });
  }

  private log(shouldLog: boolean, ...messages: any) {
    if (shouldLog) {
      messages.unshift('Gmail-inbox:');
      console.log.apply(console, messages);
    }
  }

  private timeout(ms: number): Promise<any> {
    return new Promise(resolve => setTimeout(resolve, ms));
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

  private guardAuthentication() {
    if (!this.authenticated) {
      throw new Error('Please authenticate with Inbox.authenticate() before performing any action');
    }
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
      searchString += `subject: ${this.arrayToAdvancedSearchString(searchQuery.subject)} `;
    }

    if (searchQuery.mustContainText) {
      searchString += `"${searchQuery.mustContainText}" `;
    }

    if (searchQuery.from) {
      searchString += `from: ${this.arrayToAdvancedSearchString(searchQuery.from)} `;
    }

    if (searchQuery.to) {
      searchString += `to: ${this.arrayToAdvancedSearchString(searchQuery.to)} `;
    }

    if (searchQuery.cc) {
      searchString += `cc: ${searchQuery.cc} `;
    }

    if (searchQuery.bcc) {
      searchString += `bcc: ${searchQuery.bcc} `;
    }

    if (searchQuery.labels) {
      searchString += `label: ${this.arrayToAdvancedSearchString(searchQuery.labels)} `;
    }

    if (searchQuery.has) {
      searchString += `has:${searchQuery.has} `;
    }

    if (searchQuery.filenameExtension) {
      searchString += `filename:${searchQuery.filenameExtension} `;
    }

    if (searchQuery.filename) {
      searchString += `filename:${searchQuery.filename} `;
    }

    if (searchQuery.is) {
      searchString += `is: ${searchQuery.is} `;
    }

    if (searchQuery.olderThan && searchQuery.olderThan.amount > 0) {
      const range = searchQuery.olderThan;
      searchString += `older_than:${range.amount}${range.period.substr(0, 1)} `;
    }

    if (searchQuery.newerThan && searchQuery.newerThan.amount > 0) {
      const range = searchQuery.newerThan;
      searchString += `newer_than:${range.amount}${range.period.substr(0, 1)} `;
    }

    if (searchQuery.category) {
      searchString += `category:${searchQuery.category} `;
    }

    if (searchQuery.before) {
      searchString += `before:${this.mapDateTypeToQuery(searchQuery.before)} `;
    }

    if (searchQuery.after) {
      searchString += `after:${this.mapDateTypeToQuery(searchQuery.after)} `;
    }

    if (searchQuery.newer) {
      searchString += `newer:${this.mapDateTypeToQuery(searchQuery.newer)} `;
    }

    if (searchQuery.older) {
      searchString += `older:${this.mapDateTypeToQuery(searchQuery.older)} `;
    }

    return searchString;
  }

  private mapDateTypeToQuery(dateType: MessageDateType | UnixTimestamp): number | string {
    if (typeof dateType === 'number') {
      return dateType;
    }

    const date = dateType.date;

    switch (dateType.precision) {
      case undefined:
      case null:
      case 'milliseconds':
        return Math.floor(date.getTime() / 1000);

      case 'day':
        return this.formatDate(date);

      case 'year':
        return date.getFullYear();
    }
  }

  private formatDate(date: Date) {
    let month = '' + (date.getMonth() + 1);
    let day = '' + date.getDate();
    const year = date.getFullYear();

    if (month.length < 2) {
      month = '0' + month;
    }
    if (day.length < 2) {
      day = '0' + day;
    }

    return [year, month, day].join('/');
  }
}
