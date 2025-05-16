module contract::swap;

// === Imports ===
use sui::{
    balance::{Self, Balance},
    sui::SUI,
    coin::{Self,Coin},
    table::{Self,Table},
    event::emit,
    };
use contract::hoh::{HOH,HOHTreasuryCap,hoh_mint,hoh_burn,AdminCap};
use sui::table::add;
use sui::pay;

// === Errors ===
const EInvaildAmount: u64 = 0;
const EInsufficientBalance: u64 = 1;

// === Constants ===
const SUI_DECIMALS: u64 = 1_000_000_000;
const EXCHANGE_RATE: u64 = 3_000_000_000; // 1 SUI = 3HOH

// === Structs ===
public struct Pool has key{
    id: UID,
    sui_balance: Balance<SUI>,
}

public struct Seed has key{
    id: UID,
    cultivators: Table<address, u64>,
    hoh_burn:u64,
}

// === Events ===
public struct WateringEvent has copy, drop {
    owner: address,
    amount: u64,
}
// === Method Aliases ===

// === Public Functions ===
fun init(ctx: &mut TxContext){
    let pool = Pool {
        id: object::new(ctx),
        sui_balance: balance::zero<SUI>(),
    };
     //初始化种子
    let seed = Seed {
        id: object::new(ctx),
        cultivators: table::new(ctx),
        hoh_burn: 0,
    };

   transfer::share_object(pool);
   transfer::share_object(seed);
}

entry fun swap_sui_to_hoh(
    treasurycap: &mut HOHTreasuryCap,
    payment: Coin<SUI>,
    pool: &mut Pool,
    ctx: &mut TxContext
) {
    
    let payment_amount = coin::value(&payment);
    assert!(payment_amount > 0, EInvaildAmount);
   
    //添加池子
    let payment_balance = coin::into_balance(payment);
    balance::join(&mut pool.sui_balance, payment_balance);

    //转账到用户
    let hoh_amount = payment_amount  * EXCHANGE_RATE / SUI_DECIMALS;
    let hoh_coin = hoh_mint(
        treasurycap,
        hoh_amount,
        ctx,
    );
    transfer::public_transfer(hoh_coin, ctx.sender());
} 

entry fun swap_hoh_to_sui(
    treasury: &mut HOHTreasuryCap,
    payment: Coin<HOH>,
    pool: &mut Pool,
    ctx: &mut TxContext
) {
    let recipient = ctx.sender();
    let payment_amount = coin::value(&payment);
    assert!(payment_amount > 0, EInvaildAmount);
    //销毁代币
    hoh_burn(treasury, payment);
    
    let sui_amount = payment_amount * SUI_DECIMALS / EXCHANGE_RATE;
    assert!(sui_amount <= balance::value(&pool.sui_balance), EInsufficientBalance);
    //从池子中扣除
    let sui_coin = coin::from_balance(balance::split(&mut pool.sui_balance, sui_amount), ctx);
    transfer::public_transfer(sui_coin, recipient);
   
}

entry fun watering (
    treasury: &mut HOHTreasuryCap,
    seed: &mut Seed,
    payment: Coin<HOH>,
    ctx: &TxContext
) {
    let payment_amount = coin::value(&payment);
    assert!(payment_amount > 0, EInvaildAmount);
    hoh_burn(treasury, payment);

    //在种子中放入育化者的名字
    let cultivator = ctx.sender();
    if(!table::contains(&seed.cultivators, cultivator)) {
        table::add(&mut seed.cultivators, cultivator, payment_amount);
    }else{
        let old_amount = table::borrow_mut(&mut seed.cultivators, cultivator);
        *old_amount = *old_amount + payment_amount;
    };
    seed.hoh_burn = payment_amount + seed.hoh_burn;

    emit(WateringEvent {
        owner: ctx.sender(),
        amount: payment_amount,
    });
}
// === View Functions ===

// === Admin Functions ===
public fun withdraw(
    _admin_cap: &mut AdminCap,
    pool: &mut Pool,
    amount: u64,
    ctx: &mut TxContext
) {
    assert!(amount > 0, EInvaildAmount);
    assert!(amount <= balance::value(&pool.sui_balance), EInsufficientBalance);
    let sui_coin = coin::from_balance(balance::split(&mut pool.sui_balance, amount), ctx);
    transfer::public_transfer(sui_coin, ctx.sender());
}


// === Package Functions ===

// === Private Functions ===

// === Test Functions ===
#[test_only]
public fun init_testing(ctx: &mut TxContext) {
    init(ctx);
}