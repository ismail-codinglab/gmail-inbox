import { Inbox } from "../Inbox";
import * as path from 'path';

console.log("ok");
(async () => {
    console.log("ok");
    let inbox = new Inbox(path.resolve(__dirname,"credentials.json"));
    
    
    console.log(await inbox.getMyLabels());

})();