interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'testnet' | 'mainnet';

const configs = {
    testnet: {
        Package:"0xb76167920a64538ac99f7d682413a775505b1f767c0fec17647453270f3d7d8b",
        HoH:"0xad2386deb5596df9b79eacb60b16c4c5f4757e410e69046e431a39a8d85eacc1",
        Pool:"0x853ba7abb06ac5032e41ff8f72e2202e16623f85e5c53fcd31b8b2d788ea8052",
        Seed:"0xa81b2e25734e0a3f63c99cca34d64b0ae7d3e8fe03e2e514838f61dafdf29289",
        HoHTreasury:"0x77709ef8a92f566ae20720ceda189cd34919fd716ebeff959157a9fb66fce601",
        Admincap:"0xb1d05c8b54a7c859f77d5254d66339e0c710bcc3077bf22a3a5d626f1972b3c5"
    },
    mainnet: {
        Package: "0x1111111111111111111111111111111111111111",
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}