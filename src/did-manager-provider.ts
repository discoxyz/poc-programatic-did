import { Manager } from "@3id/did-manager";
import { EthereumAuthProvider } from "@ceramicnetwork/blockchain-utils-linking";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { AbstractProvider, Wallet, getDefaultProvider } from "ethers";

class PrivateKeyEthProvider {
    wallet: Wallet;
    provider: AbstractProvider;
    constructor(privateKey: string) {
      this.provider = getDefaultProvider("https://mainnet.infura.io/v3/3dce30033a014df282da551284d48453");
      this.wallet = new Wallet(privateKey, this.provider);
    }
  
    async request({ method, params }: { method: string; params: any[] }) {
      // return await this.provider.send(method, params);
      switch (method) {
        case "personal_sign":
          return await this.signMessageWithSigningKey(params[0], params[1]);
        case "eth_chainId":
          return await this.getChainId();
        case 'eth_getCode':
          return await this.getEthCode(params[0], params[1]);
  
      }
    }
  
    async signMessageWithSigningKey(message: string, accountId: string) {
      if (this.wallet.address.toLowerCase() != accountId.toLowerCase()  ) throw new Error("Account Id doesn't match");
      return await this.wallet.signMessage(message);
    }
  
    async getChainId() {
      const network = await this.provider.getNetwork();
      return network.chainId
    }
  
    async getEthCode(address: string, blocktag?: string) {
      return await this.provider.getCode(address, blocktag)
    }
  }

  export default async function getDidProvider(walletAccountId: string, privateWalletKey: string) {
    const ceramic = new CeramicClient("https://ceramic.disco.xyz");
    const provider = new PrivateKeyEthProvider(privateWalletKey);
    const ethProvider = new EthereumAuthProvider(provider, walletAccountId);
    const didManager = new Manager(ethProvider, { ceramic });
    const didStr = await didManager.createAccount({skipMigration: true});
    return didManager.didProvider(didStr);
  }