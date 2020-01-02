import { Message } from "./Inbox";
import { Label } from "./Label.interface";
import { SearchQuery } from "./SearchQuery.interface";

/**
 * If you update this, please also update the docs in Readme.md
 */
export interface InboxMethods {
  /**
   * Logs the user in. 
   * If there is no authenticated user then a instruction will pop-up and an input is required
   */
  authenticateAccount(): Promise<void>;
  /**
   * Finds messages based on the searchQuery
   * Can be typed or plain text as you can be used to in the gmail search-bar
   */
  findMessages(searchQuery: SearchQuery| string);
  /**
   * Gets all the labels. Default ones and custom ones.
   */
  getAllLabels(): Promise<Label[]>;
  /**
   * Gets the latest messages
   */
  getLatestMessages(): Promise<Message[]>;
  /**
   * Waits until a message is received. 
   * Handy for testing if the 'welcome' or 'verify email' email is being send within a time limit e.g. 60seconds
   */
  waitTillMessage(
    searchQuery: SearchQuery | string,
    shouldLogEvents: boolean,
    timeTillNextCallInSeconds: number,
    maxWaitTimeInSeconds: number
  ): Promise<Message[]>;
}