import { google, gmail_v1 } from "googleapis";
import { readFileSync } from "fs";
import { authorizeAccount } from "./GoogleAuthorizer";
import { Label } from "./Label.interface";

export class Inbox {
  private gmailApi: gmail_v1.Gmail;
  constructor(private credentialsJsonPath: string, private tokenPath = 'gmail-token.json') {
    this.gmailApi = this.authenticateAccount(credentialsJsonPath, tokenPath);
  }

  private authenticateAccount(credentialsJsonPath: string, tokenPath: string) {
    let oAuthClient = authorizeAccount(credentialsJsonPath, tokenPath);
    return google.gmail({ version: "v1", oAuth2Client: oAuthClient } as any);
  }

  public async getMyLabels(): Promise<Label[]> {

    return new Promise((resolve, reject) => {
      this.gmailApi.users.labels.list(
        {
          userId: 'me'
        }, (errorMessage, result) => {
          if(errorMessage){
            reject(errorMessage);
            return;
          }

          resolve(result?.data.labels);
        }
      )
    });
  }

  /**
   * Retrieves all existing emails
   */
  public async getAllMessages(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let labels = await this.getMyLabels();

      const inboxLabelId = (labels as Label[]).find(l => l.name === "INBOX");
      if(!inboxLabelId) {
        throw new Error("Could not find INBOX");
      }
      this.gmailApi.users.messages.list({
        userId: 'me'
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
