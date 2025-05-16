interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'testnet' | 'mainnet';

const configs = {
    testnet: {
        Package:"0x8a774b80ea67ee7e33be56572880db0faaa6d626fa2afb81e739024da57d10cb",
        Pool:"0xeefa28a4eabaf119478e11d432bff03d40b5ab9c1abab8cf486b9a78e112a2d1",
        Seed:"0x2faa42803e007e646acfbe303105eb7a480d583fcffd349832d8630c96739c7f",
        HoHTreasury:"0xcabf476ff386f9bb7ca8da06a89d28fde70a4a020b48e011e808cc089e157664",
    },
    mainnet: {
        Package: "0x1111111111111111111111111111111111111111",
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}