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

// public fun swap_sui_to_hoh(
//   treasurycap: &mut HOHTreasuryCap,
//   payment: Coin<SUI>,
//   amount: u64,
//   pool: &mut Pool,
//   ctx: &mut TxContext
// )
export const swap_HoH = createBetterTxFactory<{amount:number}>((tx, networkVariables, {amount }) => { 
  const splitResult = tx.splitCoins(tx.gas, [tx.pure.u64(amount)]);
  tx.moveCall({
    package:  networkVariables.Package,
    module: "swap",
    function: "swap_sui_to_hoh",
    arguments: [tx.object(networkVariables.HohTreasury),tx.object(splitResult),tx.pure.u64(amount),tx.object(networkVariables.Pool)],
    typeArguments: ["0x2::sui::SUI"],
  });
  return tx;
});