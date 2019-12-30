import { gmail_v1 } from "googleapis";
import { Message } from "./Inbox";

export const formatMessage = (message: {config: any, data: gmail_v1.Schema$Message, headers: any}) => {
  let prettyMessage = {
    messageId: message.data.id,
    threadId: message.data.threadId,
    labelIds: message.data.labelIds,
    snippet: message.data.snippet,
    historyId: message.data.historyId,
    internalDate: message.data.internalDate,
    headers: message.data.payload,
    body: getMessageBody(message)
  };

  return prettyMessage;
}

const getMessageBody = (message: { config: any, data: gmail_v1.Schema$Message, headers: any }) => {
  let body: any = {};
  if (message.data.payload?.body?.size) {
    switch (message.data.payload.mimeType) {
      case "text/html":
        body.html = Buffer.from(body.data, "base64").toString("utf8");
        break;
      case "text/plain":
      default:
        body.text = Buffer.from(body.data, "base64").toString("utf8");
        break;
    }
  } else {

    let htmlBodyPart = message.data.payload?.parts?.find((part) => part.mimeType === "text/html");

    if (htmlBodyPart && htmlBodyPart.body && htmlBodyPart.body.data) {
      body.html = Buffer.from(htmlBodyPart.body.data, "base64").toString(
        "utf8"
      );
    }
    let textBodyPart = message.data.payload?.parts?.find((part) => part.mimeType === "text/plain");

    if (textBodyPart && textBodyPart.body && textBodyPart.body.data) {
      body.text = Buffer.from(textBodyPart.body.data, "base64").toString(
        "utf8"
      );
    }
  }
  return body;
}