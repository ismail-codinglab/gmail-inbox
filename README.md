# Gmail-inbox

Gmail-inbox is a simplified gmail API to receive emails in coding. It helps with end-to-end testing your signup process, test email functionality and automate processes that require receiving emails.

### Installation

Install the dependencies 

```sh
$ npm install -S gmail-inbox
```

# Example

Complete examples can be found in the `examples/` folder

##### Receive email example
 &nbsp;
```javascript
import { Inbox } from 'gmail-inbox';

async function exeCuteMe(){
  let inbox = new Inbox('credentials.json');
  await inbox.authenticateAccount(); // logs user in
  
  let messages = await inbox.getInboxMessages();

  console.log("my inbox messages", JSON.stringify(messages,null,4));
}

exeCuteMe();
```

# Getting started

### Get gmail API credentials

To work with the gmail API you need to get the credentials from the google cloud console.

**Step 1**
Follow the google instructions to [Create a client ID and client secret](https://developers.google.com/adwords/api/docs/guides/authentication#create_a_client_id_and_client_secret).

**Step 2**
Go to https://console.cloud.google.com/apis/credentials and download the OAuth2 credentials file, as shown in the image below.
![Google cloud platform](https://i.ibb.co/cF00Qxh/image.png)

Note: make sure you selected 'other' as project and that the `redirect_uris` contains something like `"urn:ietf:wg:oauth:2.0:oob"`

**Step 3** Copy the example code in #example and execute the script

**Step 4**
The application will prompt to visit the authorization url. Navigate to the url, select your email and copy the code as shown in the image below. 
![Copy image url](https://i.ibb.co/nrSf7rK/image.png)

**Step 5**
Done! You're good to go, you should be able to see your inbox messages, enjoy coding! :)


### Development

Want to contribute? Great!

Help us by creating a pull request
