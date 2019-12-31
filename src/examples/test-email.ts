import * as path from 'path';
import { Inbox } from '../Inbox';
import { SearchQuery } from '../SearchQuery.interface';

(async () => {
  const inbox = new Inbox(path.resolve(__dirname, 'credentials.json'));

  await inbox.authenticateAccount();
  console.log('My labels', await inbox.getAllLabels());
  console.log('My inbox', await inbox.getInboxMessages());
  console.log(
    "My mails with pdf's",
    await inbox.findMessages({
      filenameExtension: 'pdf',
    } as SearchQuery),
  );
})();
