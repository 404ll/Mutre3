'use client'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { useEffect, useState } from 'react'
import { ConnectButton } from '@mysten/dapp-kit'
import { createBetterTxFactory,networkConfig, suiClient, } from "@/contracts/index";
import { swap_HoH,queryWaterEvent,watering,swap_Sui,withdraw,queryAdminCap, queryAddressHOH} from '@/contracts/query'
import { useBetterSignAndExecuteTransaction } from '@/hooks/useBetterTx'
import { Button } from '@/components/ui/button'
export default function TestPage() {
    const account = useCurrentAccount();
    const [amount, setAmount] = useState(0);
    const {handleSignAndExecuteTransaction: swapToHOH} = useBetterSignAndExecuteTransaction({
        tx: swap_HoH,
    });
    const {handleSignAndExecuteTransaction: waterSeed} = useBetterSignAndExecuteTransaction({
        tx: watering,
    });
    const {handleSignAndExecuteTransaction: swapToSUI} = useBetterSignAndExecuteTransaction({
        tx: swap_Sui,
    });
    
    const {handleSignAndExecuteTransaction: withdrawToPool} = useBetterSignAndExecuteTransaction({
        tx: withdraw,
    });
    
    const handleSwap = async () => {
        if (account?.address) {
                let amountInMist = amount * 1000000000; // Convert to mist
                swapToHOH({amount:amountInMist}).onSuccess(async (response) => {
                    console.log('Transaction successful:', response);
                    setAmount(0);
                }).onError((error) => {
                    console.error('Transaction failed:', error);
                }).execute();
        }
    };

    const handleWatering = async() =>{
        if(account?.address) {
            let amount = 0.1*1000000000;
            waterSeed({amount:amount}).onSuccess(async(response) =>{
                console.log('Transaction successful:', response);
            }).execute();
        }
    }

    const handleSwapToSUI = async()=>{
        if (account?.address) {
         // 获取用户的 HOH 代币
          const userHohCoins = await queryAddressHOH(account.address);
          // 提取代币ID数组
            const coinIds = userHohCoins.map(coin => coin.id);
            let amountInMist = 0.1 * 1000000000; // Convert to mist
            swapToSUI({amount:amountInMist,coins:coinIds}).onSuccess(async (response) => {
                console.log('Transaction successful:', response);
                setAmount(0);
            }).onError((error) => {
                console.error('Transaction failed:', error);
            }).execute();
    }
    }

    const handleWithdraw = async() =>{
        if (account?.address) {
            queryAdminCap(account?.address)
            let amountInMist = 0.1 * 1000000000; // Convert to mist
            withdrawToPool({amount:amountInMist}).onSuccess(async (response) => {
                console.log('Transaction successful:', response);
            }).onError((error) => {
                console.error('Transaction failed:', error);
            }).execute();
        }
    }

    return (
        <div className="min-h-screen flex flex-col">
            <header className="flex justify-between items-center p-4 bg-white shadow-md">
                <div className="flex items-center rounded-full overflow-hidden">
                    <h1>Test Page</h1>
                </div>
                <ConnectButton />
            </header>
            <main className="flex-grow flex flex-col items-center justify-center p-8">
              <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Swap SUI to HoH</h2>
                
                <div className="space-y-6">
                  <div className="relative">
                    <label htmlFor="amount" className="text-sm font-medium text-gray-700 mb-1 block">
                      Amount
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <input
                        type="number"
                        id="amount"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-4 pr-12 py-3 sm:text-sm border-gray-300 rounded-lg"
                        placeholder="0.0"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-gray-500 sm:text-sm">SUI</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <div className="bg-gray-100 rounded-full p-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">You will receive approximately:</p>
                    <p className="text-lg font-medium text-gray-900">{(amount * 3).toFixed(2)} HoH</p>
                  </div>
                  
                  <button
                    onClick={handleSwap}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    Swap to HoH
                  </button>
                </div>
              </div>

              <Button
                  onClick={queryWaterEvent}>
                    queryWaterEvent
                  </Button>

                  <Button
                  onClick={handleWatering}>
                    Watering..
                  </Button>

                    <Button
                    onClick={handleSwapToSUI}>
                        SwapToSui
                    </Button>

                    <Button
                    onClick={handleWithdraw
                    }>
                        withdraw
                    </Button>
            </main>
        </div>
    );
}