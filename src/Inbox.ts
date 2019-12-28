import { gmail_v1 } from "googleapis";
import { readFileSync } from "fs";

export class Inbox {
  constructor(private credentialsJsonPath: string, private tokenPath = 'gmail-token.json') {
    this.authenticateAccount(credentialsJsonPath);
  }

  private authenticateAccount(credentialsJsonPath: string) {
    let allCredentials: any;
    try{
      const credentialsString = readFileSync(credentialsJsonPath,{encoding: "utf8"});
      allCredentials = JSON.parse(credentialsString);
    }catch(e) {
      this.log("Unable to find or parse credentials json file:",e.message);
      return;
    }
    let credentialsDataKey: string = Object.keys(allCredentials)[0];
    if(!credentialsDataKey){
      this.log("credentials json file contains no data, expected object with credentials");
    }
    let credentials = allCredentials[credentialsDataKey];
    if(
      !credentials || 
      !credentials.client_id ||
      !credentials.client_secret ||
      !credentials.redirect_uris ||
      !credentials.redirect_uris[0]
    ){
      this.log("Credentials do not contain required attributes client_id, client_secret and at least one redirect_uris item");
    }
    new gmail_v1.Gmail()
  }

  private log(...messages: string[]){
    messages.unshift("Gmail-inbox:");
    console.log.apply(console, [messages]);
  }

  /**
   * Retrieves all existing emails
   */
  public async getAllMessages(): Promise<any> {
    return await this.getGmailMessages();
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
  }){

  }
}
