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
    arguments: [tx.object(networkVariables.HohTreasury),tx.object(splitResult),tx.object(networkVariables.Pool)],
  });
  return tx;
});

// public fun swap_hoh_to_sui(
//   treasury: &mut HOHTreasuryCap,
//   payment: Coin<HOH>,
//   pool: &mut Pool,
//   ctx: &mut TxContext
// )
export const swap_Sui = createBetterTxFactory<{amount:number}>((tx, networkVariables, {amount }) => {
  const splitResult = tx.splitCoins(tx.object(networkVariables.Hoh), [tx.pure.u64(amount)]);
  tx.moveCall({
    package:  networkVariables.Package,
    module: "swap",
    function: "swap_hoh_to_sui",
    arguments: [tx.object(networkVariables.HohTreasury),tx.object(splitResult),tx.object(networkVariables.Pool)],
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
  console.log("coin",networkVariables.Hoh);
  const splitResult = tx.splitCoins(tx.object(networkVariables.Hoh), [tx.pure.u64(amount)]);
  console.log("splitResult", splitResult.values);
  tx.moveCall({
    package:  networkVariables.Package,
    module: "swap",
    function: "watering",
    arguments: [tx.object(networkVariables.HohTreasury),tx.object(networkVariables.Seed),tx.object(splitResult)],
  });
  return tx;
});
