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

//查询水滴事件--限制
export const queryWaterEvent = async(options?: {
  timeRange?: { startTime: number; endTime: number };
  sender?: string;
  limit?: number;
  cursor?: string;
}): Promise<WateringEvent[]> => {

  try {
    // 构建基本查询选项
    const eventType = `${networkConfig.testnet.variables.Package}::swap::WateringEvent`;
    
    // 创建查询选项 - 基本参数
    const queryOptions: any = {
      limit: options?.limit || 50
    };
    
    // 只能使用一种过滤器，优先使用事件类型过滤器
    queryOptions.query = { MoveEventType: eventType };
    
    // 添加分页游标
    if (options?.cursor) {
      queryOptions.cursor = options.cursor;
    }
    
    // 执行查询
    const events = await suiClient.queryEvents(queryOptions);
    
    // 在客户端过滤时间范围
    let filteredEvents = events.data;
    
    // 如果提供了时间范围，在客户端进行过滤
    if (options?.timeRange) {
      const startTime = options.timeRange.startTime.toString();
      const endTime = options.timeRange.endTime.toString();
      
      filteredEvents = filteredEvents.filter(event => {
        const eventTime = Number(event.timestampMs);
        return eventTime >= startTime && eventTime <= endTime;
      });
    }
    
    // 如果提供了发送者，在客户端进行过滤
    if (options?.sender) {
      filteredEvents = filteredEvents.filter(event => 
        event.sender === options.sender
      );
    }
    
    // 处理事件数据
    const wateringEvents: WateringEvent[] = [];
    for (const event of filteredEvents) {
      wateringEvents.push({
        ...event.parsedJson as WateringEvent,
      });
    }
    
    console.log(`找到 ${wateringEvents.length} 个符合条件的事件`);
    return wateringEvents;
  } catch (error) {
    console.error("查询事件失败:", error);
    return [];
  }
};

export const queryWaterEventByTime = async () => {
  try {
    const oneDayAgo = Date.now() - 86400000; // 24小时前
    const now = Date.now();

    const recentEvents = await queryWaterEvent({
        timeRange: {
          startTime: oneDayAgo,
          endTime: now,
        },
      limit: 10
    });
    return recentEvents;
  } catch (error) {
    console.error("获取最近24小时事件失败:", error);
    return [];
  }
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

export const queryAddressHOH = async(address: string) => {
  // 先获取余额检查用户是否有 HOH 代币
  const balanceResponse = await suiClient.getBalance({
    owner: address,
    coinType: HOH_TYPE,
  });
  console.log("balance", balanceResponse.totalBalance);
  
  // 如果没有余额，返回空数组
  if (Number(balanceResponse.totalBalance) <= 0) {
    return [];
  }
  
  // 获取所有代币
  const allCoins = await suiClient.getAllCoins({
    owner: address,
  });
  
  // 过滤出 HOH 类型的代币
  const hohCoins = allCoins.data.filter(coin => 
    coin.coinType === HOH_TYPE
  );
  
  // 转换为函数期望的格式
  return hohCoins.map(coin => ({
    id: coin.coinObjectId,
    balance: Number(coin.balance),
    type: coin.coinType
  }));
}

// public struct Seed has key{
//   id: UID,
//   cultivator: Table<address, u64>,
//   hoh_burn:u64,
// }

export const queryAllCultivator = async () => {
  const obj = await suiClient.getObject({
    id: networkConfig.testnet.variables.Seed,
    options: {
      showContent: true,
      showType: true,
    },
  });

  console.log("seed obj", obj);

  if (obj.data && obj.data.content && "fields" in obj.data.content) {
    const table = (obj.data.content as any).fields.cultivator;
    console.log("Cultivator table:", table);

    // 使用 table 本身作为 parentId
    const tableId = table.id || table.fields?.id?.id || table.fields?.tableId;
    if (!tableId) {
      throw new Error("Unable to determine tableId from cultivator table");
    }
    console.log("tableId", tableId);

    // 使用分页获取所有动态字段
    let hasNextPage = true;
    let cursor: string | null = null;
    let allFields: any[] = [];

    while (hasNextPage) {
      const tableDatas = await suiClient.getDynamicFields({
        parentId: tableId,
        cursor: cursor,
        limit: 100, // 设置较大的限制以减少请求次数
      });

      allFields = allFields.concat(tableDatas.data);

      hasNextPage = tableDatas.hasNextPage;
      cursor = tableDatas.nextCursor;

      if (hasNextPage) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    console.log(`总共发现 ${allFields.length} 个培育者`);

    const batchSize = 20;
    const cultivators = [];

    for (let i = 0; i < allFields.length; i += batchSize) {
      const batch = allFields.slice(i, i + batchSize);

      const batchPromises = batch.map(async (item) => {
        const fieldObject = await suiClient.getDynamicFieldObject({
          parentId: tableId,
          name: item.name,
        });

        if (
          fieldObject.data &&
          fieldObject.data.content &&
          "fields" in fieldObject.data.content
        ) {
          const value =
            (fieldObject.data.content as any).fields.value / 1000000000;
          return {
            address: item.name.value,
            burnAmount: value,
          };
        }
        return null;
      });

      const batchResults = await Promise.all(batchPromises);
      cultivators.push(...batchResults.filter(Boolean));

      if (i + batchSize < allFields.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    cultivators
      .filter((a) => a !== null)
      .sort((a, b) => b.burnAmount - a.burnAmount);

    return cultivators;
  } else {
    throw new Error("Invalid object structure: 'fields' not found in content");
  }
}

export const querySeedBurn = async () => { 
  const obj = await suiClient.getObject({
    id: networkConfig.testnet.variables.Seed,
    options: {
      showContent: true,
      showType: true,
    },
  });


  if (obj.data && obj.data.content && "fields" in obj.data.content) {
    const seed = (obj.data.content as any).fields;
    console.log("Seed:", seed);
    return seed.hoh_burn / 1000000000; // 转换为正常单位
  } else {
    throw new Error("Invalid object structure: 'fields' not found in content");
  }
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
    // 修复：将每个ID转换为对象引用
    const sources = coins.slice(1).map(id => tx.object(id));
    
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

// 添加一个简单的时间范围查询测试函数
export const testTimeRangeQuery = async() => {
  try {
    const oneDayAgo = Date.now() - 86400000;
    const now = Date.now();
    
    // 构建查询选项 - 尽可能简单
    const queryOptions = {
      // 查询过滤器
      query: {
        // 使用 TimeRange 查询所有事件
        TimeRange: {
          startTime: oneDayAgo.toString(),
          endTime: now.toString()
        }
      }
    };
    
    console.log("测试查询选项:", JSON.stringify(queryOptions, null, 2));
    
    // 执行查询
    const events = await suiClient.queryEvents(queryOptions);
    
    console.log(`找到 ${events.data.length} 个事件`);
    
    // 返回结果
    return events.data;
  } catch (error) {
    console.error("测试查询失败:", error);
    console.error("错误详情:", JSON.stringify(error, null, 2));
    return [];
  }
};