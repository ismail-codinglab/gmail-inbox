import { google, gmail_v1 } from "googleapis";
import { readFileSync } from "fs";
import { authorizeAccount } from "./GoogleAuthorizer";
import { Label } from "./Label.interface";
import { SearchQuery } from "./SearchQuery.interface";
//support for typescript debugging (refers to ts files instead of the transpiled js files)
import * as sourceMapSupport from 'source-map-support';
import { formatMessage } from "./formatMessage";
sourceMapSupport.install();

//unhandled rejections are untraceable with no stacktrace, this adds stacktraces.
process.on('unhandledRejection', console.log);


export interface Message {
  messageId: string,
  threadId: string,
  labelIds: string[],
  snippet: string,
  historyId: string,
  /**
   * unix ms timestamp string
   */
  internalDate: string,
  headers: any[],
  body: {
    html: string | undefined,
    text: string | undefined
  }
}

export class Inbox {
  private gmailApi: gmail_v1.Gmail;
  constructor(private credentialsJsonPath: string, private tokenPath = 'gmail-token.json') {
    this.gmailApi = this.authenticateAccount(credentialsJsonPath, tokenPath);
  }

  private authenticateAccount(credentialsJsonPath: string, tokenPath: string) {
    let oAuthClient = authorizeAccount(credentialsJsonPath, tokenPath);
    return google.gmail({ version: "v1", auth: oAuthClient });
  }

  public async getAllLabels(): Promise<Label[]> {

    return new Promise((resolve, reject) => {
      this.gmailApi.users.labels.list(
        {
          userId: 'me',
        }, (errorMessage, result) => {
          if (errorMessage) {
            reject(errorMessage);
            return;
          }

          resolve(result?.data.labels);
        }
      )
    });
  }

  private async getMessageById(messageId: string): Promise<Message> {
    return new Promise((resolve, reject) => {
      this.gmailApi.users.messages.get(
        {
          userId: "me",
          id: messageId,
          format: "full"
        },
        (errorMessage, message) => {
          if (errorMessage) {
            reject(errorMessage);
          } else {
            resolve(formatMessage(message as any) as Message);
          }
        }
      );
    })
  }

  /**
   * Retrieves all existing emails
   */
  public async getAllMessages(): Promise<{ config: any, data: gmail_v1.Schema$Message, headers: any }[]> {
    return new Promise(async (resolve, reject) => {
      let labels = await this.getAllLabels();

      const inboxLabelId = (labels as Label[]).find(l => l.name === "INBOX")?.id;
      if (!inboxLabelId) {
        throw new Error("Could not find INBOX");
      }
      this.gmailApi.users.messages.list({
        userId: 'me',
        labelIds: [inboxLabelId],

      }, async (errorMessage, result) => {
        if (errorMessage) {
          reject(errorMessage);
          return;
        }

        let gmailMessages: gmail_v1.Schema$Message[] | undefined = result?.data.messages;
        if (!gmailMessages) {
          return resolve([]);
        }

        let messages: gmail_v1.Schema$Message[] = await Promise.all(gmailMessages.map(async (message: gmail_v1.Schema$Message): Promise<any> => {
          if (message.id) {
            return this.getMessageById(message.id);
          }
          return null;
        }));

        messages.filter((message) => !!message === true);

        resolve(messages as any);
      });
      this.findMessages(<SearchQuery>{
        filename: "pdf"
      });

    });
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
  public findMessages(searchQuery: SearchQuery | string) {
    let searchString: string;
    if(typeof searchQuery == "string"){
      searchString = searchQuery;
    }else{
      searchString = this.mapSearchQueryToSearchString(searchQuery);
    }

    this.gmailApi.users.messages.list({
      userId: "me",
      q: searchString
    })
  }

  private arrayToAdvancedSearchString(itemOrItems: string[] | string){
    if(typeof itemOrItems === "string") return itemOrItems;

    return `(${itemOrItems.join(" ")})`;
  }

  private mapSearchQueryToSearchString(searchQuery: SearchQuery): string {
    let searchString: string = "";

    if(searchQuery.message) {
      searchString += searchQuery.message;
    }

    if(searchQuery.subject){
      searchString += `subject: ${this.arrayToAdvancedSearchString(searchQuery.subject)}`
    }

    if(searchQuery.mustContainText) {
      searchString += ` "${searchQuery.mustContainText}"`;
    }

    if(searchQuery.from){
      searchString += ` from: ${this.arrayToAdvancedSearchString(searchQuery.from)}`;
    }

    if(searchQuery.to){
      searchString += ` to: ${this.arrayToAdvancedSearchString(searchQuery.to)}`;
    }

    if(searchQuery.cc){
      searchString += ` cc: ${searchQuery.cc}`;
    }

    if(searchQuery.bcc){
      searchString += ` bcc: ${searchQuery.bcc}`;
    }

    if(searchQuery.labels){
      searchString += ` label: ${this.arrayToAdvancedSearchString(searchQuery.labels)}`;
    }

    if(searchQuery.has){
      searchString += ` has: ${searchQuery.has}`;
    }

    if(searchQuery.filenameExtension){
      searchString += ` filename: ${searchQuery.filenameExtension}`;
    }

    if(searchQuery.filename){
      searchString += ` filename: ${searchQuery.filename}`;
    }

    if(searchQuery.is){
      searchString += ` is: ${searchQuery.is}`;
    }

    

    return searchString;
  }
}
