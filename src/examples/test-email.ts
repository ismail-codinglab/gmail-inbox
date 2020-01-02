import * as path from 'path';
import { Inbox } from '../Inbox';
import { SearchQuery } from '../SearchQuery.interface';

(async () => {
  const inbox = new Inbox(path.resolve(__dirname, 'credentials.json'));

  await inbox.authenticateAccount();
  console.log('My labels', await inbox.getAllLabels());
  console.log('My inbox', await inbox.getLatestMessages());
  console.log("send yourself a mail with the subject 'test' and the content 'test' :)");
  console.log(
    "My test mail",
    await inbox.waitTillMessage({
      filenameExtension: "pdf", // note: the filenames containing pdf e.g. 'not-a-pdf.png' will also be returned
      has: "attachment", // must have an attachment
      mustContainText: "verify", // either subject or message must contain string test
      newerThan:{ // only of today
        amount: 1,
        period: "day"
      },
      subject: "welcome", // subject must contain string test
      
    } as SearchQuery)
  );
})();
