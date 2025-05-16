import { isValidSuiAddress } from "@mysten/sui/utils";
import { createBetterTxFactory,networkConfig, suiClient, } from "./index";
import { SuiObjectResponse,CoinMetadata } from "@mysten/sui/client";
import { categorizeSuiObjects, CategorizedObjects } from "@/utils/assetsHelpers";
import { SuiCoin } from "@/types/contract";
import { WateringEvent } from "@/types/contract";

const HOH_TYPE = "0xb76167920a64538ac99f7d682413a775505b1f767c0fec17647453270f3d7d8b::hoh::HOH"

export const getUserProfile = async (address: string): Promise<CategorizedObjects> => {
  if (!isValidSuiAddress(address)) {
    throw new Error("Invalid Sui address");
  }

  let hasNextPage = true;
  let nextCursor: string | null = null;
  let allObjects: SuiObjectResponse[] = [];

  while (hasNextPage) {
    const response = await suiClient.getOwnedObjects({
      owner: address,
      options: {
        showContent: true,
      },
      cursor: nextCursor,
    });

    allObjects = allObjects.concat(response.data);
    hasNextPage = response.hasNextPage;
    nextCursor = response.nextCursor ?? null;
  }

  return categorizeSuiObjects(allObjects);
};

//======Query=======//
export const queryWaterEvent = async():Promise<WateringEvent[]> =>{
  const events = await suiClient.queryEvents({
    query:{
      MoveEventType:`${networkConfig.testnet.package}::swap::WateringEvent`
    }
  });
  const wateringEvents: WateringEvent[] = [];
  for(const event of events.data){
    // Assuming event has a structure that can be mapped to WateringEvent
    wateringEvents.push(event.parsedJson as WateringEvent);
  }
  console.log("wateringEvents",wateringEvents);
  return wateringEvents;
}

export const queryAdminCap = async(address:string) =>{

  interface SuperAdminCap  {
    id: {id:string};
  } 
  
  const superadmin = await suiClient.getOwnedObjects({
    owner: address,
    options: {
      showContent: true,
      showType: true,
    },
    filter: {
      StructType: `${networkConfig.testnet.variables.Package}::hoh::AdminCap`,
    },
  });

  // 处理没有找到 Profile 的情况
  if (!superadmin.data || superadmin.data.length === 0) {
    return null; 
  }

  // 直接获取第一个对象（因为确定只有一个）
  const adminObj = superadmin.data[0];
  
  // 确保有内容
  if (!adminObj.data?.content || !("fields" in adminObj.data.content)) {
    throw new Error("Invalid profile data structure");
  }

  // 提取并返回 Profile 数据
  const suiperAdmin = adminObj.data.content;
  const suiperAdminCap = suiperAdmin.fields as unknown as SuperAdminCap;
  console.log("superadmin",suiperAdminCap.id.id);
  return suiperAdminCap.id.id

}


export const queryAddressSUI = async(address:string) =>{
  const balance = await suiClient.getBalance({
    owner: address,
    coinType: "0x2::sui::SUI",
  })
  console.log("balance",balance.totalBalance);
//   balance{
//     coinObjectCount:nubmer
//     coinType:string 
//     lockedBalance: {}
//     totalBalance: string 
//   }
  return balance.totalBalance;
}

export const queryAddressHOH = async(address:string,) =>{
  const balance = await suiClient.getBalance({
    owner: address,
    coinType: HOH_TYPE,
  })
  console.log("balance",balance.totalBalance);
  return balance.totalBalance;
}
//======Create Tx=======//

// public fun swap_sui_to_hoh(
//   treasurycap: &mut HOHTreasuryCap,
//   payment: Coin<SUI>,
//   pool: &mut Pool,
//   ctx: &mut TxContext
// )
export const swap_HoH = createBetterTxFactory<{amount:number}>((tx, networkVariables, {amount }) => {
  const splitResult = tx.splitCoins(tx.gas, [tx.pure.u64(amount)]);
  tx.mergeCoins
  console.log("splitResult", splitResult.values);
  tx.moveCall({
    package:  networkVariables.Package,
    module: "swap",
    function: "swap_sui_to_hoh",
    arguments: [tx.object(networkVariables.HoHTreasury),tx.object(splitResult),tx.object(networkVariables.Pool)],
  });
  return tx;
});

// public fun swap_hoh_to_sui(
//   treasury: &mut HOHTreasuryCap,
//   payment: Coin<HOH>,
//   pool: &mut Pool,
//   ctx: &mut TxContext
// )
export const swap_Sui = createBetterTxFactory<{amount: number,coins:string[]}>((tx, networkVariables, {amount, coins}) => {
  // 1. 如果有多个代币，先合并
  if (coins.length > 1) {
    // 找到同类型的第一个代币作为目标
    const destination = tx.object(coins[0]);
    // 其余代币作为源
    const sources = coins.slice(1);
    console.log("sources",sources);
    // 执行合并
    tx.mergeCoins(destination, sources);
    // 从合并后的代币中分割出交易金额
    let splitResult = tx.splitCoins(destination, [tx.pure.u64(amount)]);
    // 调用合约
    tx.moveCall({
      package: networkVariables.Package,
      module: "swap",
      function: "swap_hoh_to_sui",
      arguments: [
        tx.object(networkVariables.HoHTreasury),
        tx.object(splitResult),  
        tx.object(networkVariables.Pool)
      ],
    });
  } else if (coins.length === 1) {
    // 只有一个代币，直接从它分割
    const coin = tx.object(coins[0]);
    console.log("一个coi1",coin);
    const splitResult = tx.splitCoins(coin, [tx.pure.u64(amount)]);
    
    tx.moveCall({
      package: networkVariables.Package,
      module: "swap",
      function: "swap_hoh_to_sui",
      arguments: [
        tx.object(networkVariables.HoHTreasury),
        tx.object(splitResult),
        tx.object(networkVariables.Pool)
      ],
    });
  } else {
    throw new Error("No coin provided for swap");
  }
  
  return tx;
});

// public fun watering (
//   treasury: &mut HOHTreasuryCap,
//   seed: &mut Seed,
//   payment: Coin<HOH>,
//   ctx: &mut TxContext
// )
export const watering = createBetterTxFactory<{amount:number,coins:string[]}>((tx, networkVariables, {amount,coins }) => {
  // 1. 如果有多个代币，先合并
  if (coins.length > 1) {
    // 找到同类型的第一个代币作为目标
    const destination = tx.object(coins[0]);
    // 其余代币作为源
    const sources = coins.slice(1);
    console.log("sources",sources);
    // 执行合并
    tx.mergeCoins(destination, sources);
    // 从合并后的代币中分割出交易金额
    let splitResult = tx.splitCoins(destination, [tx.pure.u64(amount)]);
    // 调用合约
    tx.moveCall({
      package: networkVariables.Package,
      module: "swap",
      function: "watering",
      arguments: [tx.object(networkVariables.HoHTreasury),tx.object(networkVariables.Seed),tx.object(splitResult)],
    });
  } else if (coins.length === 1) {
    // 只有一个代币，直接从它分割
    const coin = tx.object(coins[0]);
    console.log("一个coi1",coin);
    const splitResult = tx.splitCoins(coin, [tx.pure.u64(amount)]);
    tx.moveCall({
    package:  networkVariables.Package,
    module: "swap",
    function: "watering",
    arguments: [tx.object(networkVariables.HoHTreasury),tx.object(networkVariables.Seed),tx.object(splitResult)],
  });
}
  return tx;
});

// public fun withdraw(
//   _admin_cap: &mut AdminCap,
//   pool: &mut Pool,
//   amount: u64,
//   ctx: &mut TxContext
// ) 
export const withdraw = createBetterTxFactory<{amount:number}>((tx, networkVariables, {amount }) => {
  tx.moveCall({
    package: networkVariables.Package,
    module: "swap",
    function: "withdraw",
    arguments: [
      tx.object(networkVariables.Admincap), 
      tx.object(networkVariables.Pool),
      tx.pure.u64(amount)
    ],
  });
  return tx;
});