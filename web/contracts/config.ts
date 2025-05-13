interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'testnet' | 'mainnet';

const configs = {
    testnet: {
        Package: "0x3687ee18828273600e23993310a8bad4b996bc3000e88a50e5b3d3aa55eb6c7a",
        Hoh:"0x2ae7877d47047a4e7a67f742c79c7276b3659539829be5e497d13219755a741d",
        Pool:"0xd75e3806af18562f126704c7942524f828e6a7b1084c43f52ba023bbfd489e4b",
        Seed:"0xf8359862bd17db0b1a6cc454bc9868f4eed27549505db84d3bc8c8c87c59edc5",
        
    },
    mainnet: {
        Package: "0x1111111111111111111111111111111111111111",
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}