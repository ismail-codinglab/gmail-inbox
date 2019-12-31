import { gmail_v1 } from 'googleapis';
import { Message } from './Inbox';

export const formatMessage = (message: { config: any; data: gmail_v1.Schema$Message; headers: any }) => {
  const prettyMessage = {
    body: getMessageBody(message),
    headers: message.data.payload,
    historyId: message.data.historyId,
    internalDate: message.data.internalDate,
    labelIds: message.data.labelIds,
    messageId: message.data.id,
    snippet: message.data.snippet,
    threadId: message.data.threadId,
  };

  return prettyMessage;
};

const getMessageBody = (message: { config: any; data: gmail_v1.Schema$Message; headers: any }) => {
  let body: any;
  const messagePayload = message.data.payload;
  const messageBody = messagePayload?.body;
  if (messageBody?.size && messagePayload) {
    switch (messagePayload?.mimeType) {
      case 'text/html':
        body.html = Buffer.from(messageBody.data as string, 'base64').toString('utf8');
        break;
      case 'text/plain':
      default:
        body.text = Buffer.from(messageBody.data as string, 'base64').toString('utf8');
        break;
    }
  } else {
    body = getPayloadParts(message);
  }
  return body;
};

const getPayloadParts = (message: { config: any; data: gmail_v1.Schema$Message; headers: any }) => {
  const body: any = {};
  const parts = message.data.payload?.parts;
  const hasSubParts = parts?.find(part => part.mimeType?.startsWith('multipart/'));
  if (hasSubParts) {
    // recursively continue until you find the content
    const newMessage: any = {
      Headers: {},
      config: {},
      data: { payload: hasSubParts } as gmail_v1.Schema$Message,
    };
    return getPayloadParts(newMessage);
  }
  const htmlBodyPart = parts?.find(part => part.mimeType === 'text/html');

  if (htmlBodyPart && htmlBodyPart.body && htmlBodyPart.body.data) {
    body.html = Buffer.from(htmlBodyPart.body.data, 'base64').toString('utf8');
  }
  const textBodyPart = parts?.find(part => part.mimeType === 'text/plain');

  if (textBodyPart && textBodyPart.body && textBodyPart.body.data) {
    body.text = Buffer.from(textBodyPart.body.data, 'base64').toString('utf8');
  }

  return body;
};
