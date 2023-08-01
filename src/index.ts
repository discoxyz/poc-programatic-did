import { getResolver as get3IDResolver } from "@ceramicnetwork/3id-did-resolver";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { DID } from "dids";
import { config } from "dotenv";
import * as readline from "readline";
import getDidProvider from "./did-manager-provider.js";

config();

const testAccount = process.env.WALLET_ACCOUNT ?? "";
const testPrivateKey = process.env.WALLET_KEY ?? "";


async function getDid(walletAccountId: string, privateWalletKey: string) {
  const ceramic = new CeramicClient("https://ceramic-single.disco.xyz");
  const didProvider = await getDidProvider(walletAccountId, privateWalletKey);

  if(didProvider === undefined) throw new Error();

  const did = new DID({
    provider: didProvider,
    resolver: {
      ...get3IDResolver(ceramic),
    },
  });

  
  // Authenticate the DID using the 3ID provider
  await did.authenticate();
  console.log("Authenticated DID", did.id)
  return did;
}

async function signJwt(walletAccount: string, walletPrivateKey: string, data: Record<string, any>) {
  const did = await getDid(walletAccount, walletPrivateKey);
  const jws = await did.createJWS({ ...data, iss: did.id });
  const jwt = `${jws.signatures[0].protected}.${jws.payload}.${jws.signatures[0].signature}`;
  return jwt;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("What is the nonce you wish to sign? ", (nonce) => {
  console.log("\n");
  signJwt(testAccount, testPrivateKey, { nonce }).then((jwt) => {
    console.log("Signed Nonce JWT:", jwt);
    rl.close();
    process.exit();
  });
});
