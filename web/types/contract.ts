// public struct Seed has key{
//     id: UID,
//     cultivator: Table<address, u64>,
//     hoh_burn:u64,
// }

export interface Seed{
    hoh:number,
    cultivator:[string,number]
}

// public struct WateringEvent has copy, drop {
//     owner: address,
//     amount: u64,
// }
export interface WateringEvent{
    owner:string,
    amount:number
}
