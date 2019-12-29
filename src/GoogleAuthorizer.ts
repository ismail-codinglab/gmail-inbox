import { google, oauth2_v1 } from "googleapis";
import { OAuth2Client } from 'google-auth-library';

import { readFileSync, writeFileSync } from "fs";
import * as readline from "readline";
import * as path from "path";

interface ClientCredentials {
    client_id: string,
    client_secret: string,
    redirect_uris: string[]
}

// If modifying these scopes, delete token.json.
const scopes = ["https://www.googleapis.com/auth/gmail.readonly"];

export const authorizeAccount = (credentialsJsonPath: string, tokenPath: string): OAuth2Client => {
    let credentials = getCredentials(credentialsJsonPath);

    let auth = new google.auth.OAuth2({
        // more info on the interface "OAuth2ClientOptions" in 'googleapis' package
        clientId: credentials.client_id,
        clientSecret: credentials.client_secret,
        redirectUri: credentials.redirect_uris[0],
    });

    let token = getToken(auth, tokenPath);

    if (token) {
        auth.setCredentials(token);
    }
    return auth;
}

const getCredentials = (credentialsJsonPath: string): ClientCredentials => {
    let allCredentials: any;
    try {
        // if(!path.isAbsolute(credentialsJsonPath)){
        //     console.log(process.cwd(),__dirname,__filename, path.resolve(__dirname,));
        //     credentialsJsonPath = path.resolve(process.cwd(),credentialsJsonPath);
        // }
        const credentialsString = readFileSync(credentialsJsonPath, { encoding: "utf8" });
        allCredentials = JSON.parse(credentialsString);
    } catch (e) {
        log("Unable to find or parse credentials json file:", e.message);
    }
    let credentialsDataKey: string = Object.keys(allCredentials)[0];
    if (!credentialsDataKey) {
        log("credentials json file contains no data, expected object with credentials");
    }
    let credentials = allCredentials[credentialsDataKey];
    if (
        !credentials ||
        !credentials.client_id ||
        !credentials.client_secret ||
        !credentials.redirect_uris ||
        !credentials.redirect_uris[0]
    ) {
        log("Credentials do not contain required attributes client_id, client_secret and at least one redirect_uris item");
    }

    return credentials;
}

const getToken = (oAuth2Client: OAuth2Client, tokenPath: string): any /* interface 'Credentials' (could not import from googleapis types) */ | null => {
    try {
        const credentialsString = readFileSync(tokenPath, { encoding: "utf8" });
        return JSON.parse(credentialsString);
    } catch (e) {
        console.log("errA",e);
        return getNewToken(oAuth2Client, tokenPath);
        return null;
    }
};

const getNewToken = async (oAuth2Client: OAuth2Client, tokenPath) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent"
    });
    console.log("Authorize this app by visiting this url:", authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    return new Promise((resolve, reject) => {
      rl.question("Enter the code from that page here: ", async code => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
          if (err) {
            reject(err);
          } else {
            writeFileSync(
              tokenPath,
              JSON.stringify(token)
            );
            resolve(token);
          }
        });
      });
    });
  }

const log = (...messages: string[]) => {
    messages.unshift("Gmail-inbox:");
    console.log.apply(console, [messages]);
    throw new Error(...messages);
}