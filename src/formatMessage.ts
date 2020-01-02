import { gmail_v1 } from 'googleapis';
import { Message } from './Inbox';

/**
 * Method is being called by Inbox class
 * 
 * @param message 
 */
export const formatMessage = (message: { data: gmail_v1.Schema$Message; }): Message => {
  const headers = message.data.payload?.headers;
  const prettyMessage: Message = {
    body: getMessageBody(message),
    from: getHeader("From", headers),
    historyId: message.data.historyId!,
    internalDate: message.data.internalDate!,
    labelIds: message.data.labelIds!,
    messageId: message.data.id!,
    snippet: message.data.snippet!,
    threadId: message.data.threadId!,
    to: getHeader("To", headers),
    subject: getHeader("Subject", headers),
    receivedOn: getHeader("Date",headers),
    getFullMessage: () => message.data.payload
  };

  return prettyMessage;
};

const getHeader = (name: string, headers: Array<{name?: string | undefined, value?: string | undefined}> | undefined) => {
  if(!headers) { return; }
  const header = headers.find(h => h.name === name)
  return header && header.value;
}

const getMessageBody = (message: { data: gmail_v1.Schema$Message;}) => {
  let body: any = {};
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

const getPayloadParts = (message: {data: gmail_v1.Schema$Message;}) => {
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
