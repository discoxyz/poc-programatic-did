import { ThreeIdProvider } from "@3id/did-provider";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { personalSign } from "@metamask/eth-sig-util";
import * as sha256 from "@stablelib/sha256";
import { DIDProvider } from "dids";
import { fromString, toString } from "uint8arrays";


function getAuthSecret(key: string) {
    const message = "Allow this account to control your identity";
    const privateKey = Buffer.from(key, "hex");
  
    // Authenticate
    const signature = personalSign({
      privateKey,
      data: message,
    });
  
    const signatureBytes = fromString(signature.slice(2));
    const entropy = sha256.hash(signatureBytes);
    const digest2 = `0x${toString(entropy, "base16")}`;
    return sha256.hash(fromString(digest2.slice(2)));
}
  
export default async function getDidProvider(walletAccountId: string, privateWalletKey: string): Promise<DIDProvider> {
    const authSecret = getAuthSecret(privateWalletKey);
  
    const ceramic = new CeramicClient("https://ceramic-single.disco.xyz");
  
    const threeID = await ThreeIdProvider.create({
      authId: walletAccountId,
      authSecret,
      ceramic,
      // See the section above about permissions management
      getPermission: (request) => Promise.resolve(request.payload.paths),
    });

    return threeID.getDidProvider();
}