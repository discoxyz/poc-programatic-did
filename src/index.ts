import { ThreeIdProvider } from "@3id/did-provider";
import { getResolver as get3IDResolver } from '@ceramicnetwork/3id-did-resolver';
import { CeramicClient } from "@ceramicnetwork/http-client";
import { TileDocument } from "@ceramicnetwork/stream-tile";
import { personalSign } from "@metamask/eth-sig-util";
import * as sha256 from "@stablelib/sha256";
import { DID } from 'dids';
import { getResolver as getKeyResolver } from 'key-did-resolver';
import { fromString, toString } from "uint8arrays";

const testDID = "did:3:kjzl6cwe1jw147x3oysta3ikhvczpiyzktzq5wzx1qeguyjeqis6pqukgt1ldj3"
const testAccount = "0x3B6F73C70B3487e7Da7efF6bc5c2cE1995E36F8d";
const testPrivateKey = "f1cef72665e8822a38b6dd4a21649b26739c7d72336140577bf38a710540f57e";
const testTile = "disco-public-user-data-test";
const testBio = "gm frens! I'm Evin.\n\nI'm so excited you're here, let's dance!";

export async function get3ID() {
  const message = "Allow this account to control your identity";
  const authSecret = authenticate(message);
  const entropy = sha256.hash(fromString(authSecret.slice(2)));
  // const message2 = 'This app wants to view and update your 3Box profile.'
  const ceramic = new CeramicClient("https://ceramic-single.disco.xyz");

  const threeID = await ThreeIdProvider.create({
    authId: testAccount,
    authSecret: entropy,
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
  })

  // Authenticate the DID using the 3ID provider
  await did.authenticate()

  ceramic.did = did;
  const didID = threeID.id;

  console.log("isTestDid", testDID == didID);

  const metadata = {
    controllers: [didID],
    family: testTile
  };
  
  const tile = await TileDocument.deterministic<any>(ceramic, metadata);
  await tile.update({...tile.content, ...{profile: {...tile.content.profile, ...{bio: testBio}}}})
  console.log(tile);
}

function authenticate(message: string) {
  const key = testPrivateKey;
  const privateKey = Buffer.from(key, "hex");

  // Authenticate
  const signature = personalSign({
    privateKey,
    data: message,
  });

  const signatureBytes = fromString(signature.slice(2));
  const digest = sha256.hash(signatureBytes);
  return `0x${toString(digest, "base16")}`;
}
