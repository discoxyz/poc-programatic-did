import { ThreeIdProvider } from "@3id/did-provider";
import { getResolver as get3IDResolver } from "@ceramicnetwork/3id-did-resolver";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { personalSign } from "@metamask/eth-sig-util";
import * as sha256 from "@stablelib/sha256";
import { DID } from "dids";
import * as readline from "readline";
import { fromString, toString } from "uint8arrays";

const testAccount = "0x3B6F73C70B3487e7Da7efF6bc5c2cE1995E36F8d";
const testPrivateKey = "f1cef72665e8822a38b6dd4a21649b26739c7d72336140577bf38a710540f57e";

function getAuthSecret(key: string) {
  const message = "Allow this account to control your identity";
  const privateKey = Buffer.from(key, "hex");

  // Authenticate
  const signature = personalSign({
    privateKey,
    data: message,
  });

  const signatureBytes = fromString(signature.slice(2));
  const digest = sha256.hash(signatureBytes);
  const digest2 = `0x${toString(digest, "base16")}`;
  return sha256.hash(fromString(digest2.slice(2)));
}

async function getDid(walletAccountId: string, privateWalletKey: string) {
  const authSecret = getAuthSecret(privateWalletKey);

  const ceramic = new CeramicClient("https://ceramic-single.disco.xyz");

  const threeID = await ThreeIdProvider.create({
    authId: walletAccountId,
    authSecret,
    ceramic,
    // See the section above about permissions management
    getPermission: (request) => Promise.resolve(request.payload.paths),
  });

  const did = new DID({
    provider: threeID.getDidProvider(),
    resolver: {
      ...get3IDResolver(ceramic),
      // ...getKeyResolver(),
    },
  });

  // Authenticate the DID using the 3ID provider
  await did.authenticate();
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
