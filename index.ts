
import { personalSign } from "@metamask/eth-sig-util";
import * as sha256 from '@stablelib/sha256';
import { mnemonicToSeed, entropyToMnemonic } from '@ethersproject/hdnode';
import { fromHex } from '@3id/common';
import { fromString, toString } from 'uint8arrays';
import { ThreeIdProvider } from "@3id/did-provider";
import { CeramicClient } from "@ceramicnetwork/http-client";



async function get3ID() {
    const message = 'Allow this account to control your identity'
    const authSecret = authenticate(message);
    const entropy = sha256.hash(fromString(authSecret.slice(2)))
    // const message2 = 'This app wants to view and update your 3Box profile.'

    const threeID = await ThreeIdProvider.create({
        authId: '0x2362Ba4Cc274E7047529f92F54937555EEf9d444',
        authSecret: entropy,
        ceramic: new CeramicClient("https://ceramic-single.disco.xyz"),
        // See the section above about permissions management
        getPermission: (request) => Promise.resolve(request.payload.paths),
      })

      console.log(threeID.id);
}

function authenticate(message: string) {
    const key = "1a2aa172f7ab996164a0a54ebfcd37865363f1219f337eade74df0aeab2e9dd0"
    const privateKey = Buffer.from(
        key,
        'hex',
      );

      // Authenticate
      const signature = personalSign({
        privateKey,
        data: message
      });

      const signatureBytes = fromString(signature.slice(2))
      const digest = sha256.hash(signatureBytes)
      return `0x${toString(digest, 'base16')}`;
}

get3ID().then();