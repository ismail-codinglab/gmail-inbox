type MessageFilterIsType = 'read' | 'unread' | 'snoozed' | 'starred' | 'important';
interface MessageFilterRangeType {
  year: number;
  month: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  /**
   * starting from '1'
   */
  day: number;
}
export interface SearchQuery {
  /**
   * Search for one or multiple potential subjects
   */
  subject?: string | string[];
  message?: string;
  mustContainText?: string | string[];
  from?: string | string[];
  to?: string | string[];
  cc?: string;
  bcc?: string;
  /**
   * In which label the message should be
   */
  labels?: string[];
  has?: 'attachment' | 'drive' | 'document' | 'spreadsheet' | 'youtube' | 'presentation';
  /**
   * Some possible extensions to search with, if not use "filename" property with your extension. e.g. filename: "png"
   * Note: The filenames containing the extension will also be returned. E.g. 'filenameExtension:"pdf" will also return 'not-a-pdf.jpg' 
   */
  filenameExtension?: 'pdf' | 'ppt' | 'doc' | 'docx' | 'zip' | 'rar';
  /**
   * you can search like filename: "pdf" or filename:"salary.pdf"
   */
  filename?: string;
  /**
   * What status the message is in
   */
  is?: MessageFilterIsType | MessageFilterIsType[];

  // after?: MessageFilterRangeType,
  // before?: MessageFilterRangeType,

  // /**
  //  * same as 'before'
  //  */
  // older?: MessageFilterRangeType,
  // /**
  //  * same as 'after'
  //  */
  // newer?: MessageFilterRangeType,

  olderThan?: {
    /**
     * Must be higher than 0
     */
    amount: number;
    period: "day" | "month" | "year"
  },
  newerThan?: {
    /**
     * Must be higher than 0
     */
    amount: number;
    period: "day" | "month" | "year"
  }
  category: "primary" | "social" | "promotions" | "updates" | "forums" | "reservations" | "purchases",
  // sizeInBytes?: number,
  // largerThanInBytes?: number,
  // smallerThanInBytes?: number,
}
