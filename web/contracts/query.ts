import { isValidSuiAddress } from "@mysten/sui/utils";
import { createBetterTxFactory,networkConfig, suiClient } from "./index";
import { SuiObjectResponse } from "@mysten/sui/client";
import { categorizeSuiObjects, CategorizedObjects } from "@/utils/assetsHelpers";

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
export const queryWaterEvent = async() =>{
  const event = suiClient.queryEvents({
    query:{
      MoveEventType:`${networkConfig.testnet.package}::swap::WateringEvent`
    }
  })
  console.log("Event",event)
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


//======Create Tx=======//

// public fun swap_sui_to_hoh(
//   treasurycap: &mut HOHTreasuryCap,
//   payment: Coin<SUI>,
//   pool: &mut Pool,
//   ctx: &mut TxContext
// )
export const swap_HoH = createBetterTxFactory<{amount:number}>((tx, networkVariables, {amount }) => {
  const splitResult = tx.splitCoins(tx.gas, [tx.pure.u64(amount)]);

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
export const swap_Sui = createBetterTxFactory<{amount:number}>((tx, networkVariables, {amount}) => {
  console.log(networkVariables.HoHTreasury);
  const splitResult = tx.splitCoins(tx.object(networkVariables.HoH), [tx.pure.u64(amount)]);
  console.log("splitResult", splitResult);
  tx.moveCall({
    package:  networkVariables.Package,
    module: "swap",
    function: "swap_hoh_to_sui",
    arguments: [tx.object(networkVariables.HoHTreasury),tx.object(splitResult),tx.object(networkVariables.Pool)],
  });
  return tx;
});

// public fun watering (
//   treasury: &mut HOHTreasuryCap,
//   seed: &mut Seed,
//   payment: Coin<HOH>,
//   ctx: &mut TxContext
// )
export const watering = createBetterTxFactory<{amount:number}>((tx, networkVariables, {amount }) => {
  console.log("coin",networkVariables.HoH);
  const splitResult = tx.splitCoins(tx.object(networkVariables.HoH), [tx.pure.u64(amount)]);
  tx.moveCall({
    package:  networkVariables.Package,
    module: "swap",
    function: "watering",
    arguments: [tx.object(networkVariables.HoHTreasury),tx.object(networkVariables.Seed),tx.object(splitResult)],
  });
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