import { google, gmail_v1 } from "googleapis";
import { readFileSync } from "fs";
import { authorizeAccount } from "./GoogleAuthorizer";
import { Label } from "./Label.interface";

//support for typescript debugging (refers to ts files instead of the transpiled js files)
import * as sourceMapSupport from 'source-map-support';
sourceMapSupport.install();

//unhandled rejections are untraceable with no stacktrace, this adds stacktraces.
process.on('unhandledRejection', console.log);

export class Inbox {
  private gmailApi: gmail_v1.Gmail;
  constructor(private credentialsJsonPath: string, private tokenPath = 'gmail-token.json') {
    this.gmailApi = this.authenticateAccount(credentialsJsonPath, tokenPath);
  }

  private authenticateAccount(credentialsJsonPath: string, tokenPath: string) {
    let oAuthClient = authorizeAccount(credentialsJsonPath, tokenPath);
    return google.gmail({ version: "v1", auth: oAuthClient });
  }

  public async getMyLabels(): Promise<Label[]> {

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

  private async getMessage(messageId: string) {
    return new Promise((resolve, reject) => {
      this.gmailApi.users.messages.get(
        {
          userId: "me",
          id: messageId,
          format: "full"
        },
        function (err, res) {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        }
      );
    })
  }

  /**
   * Retrieves all existing emails
   */
  public async getAllMessages(): Promise<{config: any, data: gmail_v1.Schema$Message, headers: any}[]> {
    return new Promise(async (resolve, reject) => {
      let labels = await this.getMyLabels();

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
            return this.getMessage(message.id);
          }
          return null;
        }));

        messages.filter((message) => !!message === true);

        resolve(messages as any);
      });

    });
  }

  /**
   * Finds existing emails
   */
  public findMessages({
    subject,

  }: {
    /**
     * Can be an exact string or a regex
     */
    /**
     * Can be an exact string or a regex
     */
    subject: string,
    message: string
  }) {

  }
}
