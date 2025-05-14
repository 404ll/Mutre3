interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'testnet' | 'mainnet';

const configs = {
    testnet: {
        Package:"0xa597b5d4458251585a52739a2d799618f9c3acdbd75db93e51b7a8a81283963a",
        Hoh:"0x526008a9f17c515ba51e716eb2b4f0a52f4d739d0e5b2f12cd153cb8ae6fd572",
        Pool:"0x54117271dc5e25cc5ed35117c2e4db2eb107cc83b53bfb328756cafb9c91a35c",
        Seed:"0xd1c2a069848cc8c8d51d43e5006915e49dad0141cb9ed9d4fcb140d962ba3dd4",
        HohTreasury:"0x00c33f0dd9bb3642bed3002444832cd585039e7b70707ecb676d1589fb3b4748",
    },
    mainnet: {
        Package: "0x1111111111111111111111111111111111111111",
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}