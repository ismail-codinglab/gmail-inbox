import { Inbox } from "../Inbox";
import * as path from 'path';
import { gmail_v1 } from "googleapis";

console.log("ok");
(async () => {
  console.log("ok");
  let inbox = new Inbox(path.resolve(__dirname, "credentials.json"));


  console.log("MY LABELS", await inbox.getMyLabels());
  let allMyMessagesUnsaved = await inbox.getAllMessages();
  let allMyMessagesSaved = JSON.parse(JSON.stringify(allMyMessagesUnsaved));

  console.log("ALL MY MESSAGES", allMyMessagesUnsaved);
  
  
})();