module contract::hoh;

// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions

use sui::{
    coin::{Self,Coin},
    balance::{Self,Supply},
    url::new_unsafe_from_bytes
};

const DECIMALS: u8 = 9;
const SYMBOLS: vector<u8> = b"HOH";
const NAME: vector<u8> = b"HOH";
const DESCRIPTION: vector<u8> = b"Watering the Last Seed. Reviving the Chain.";
const ICON_URL: vector<u8> = b"https://github.com/404ll/My-images/blob/main/img/image.png"; 

// =======ERROR=========
const EWrongAmount: u64 = 0;

// =======STRUCT=========
public struct HOH has drop {}

public struct AdminCap has key, store {
    id: UID,
}

public struct HOHTreasuryCap has key, store {
    id: UID,
    supply: Supply<HOH>
}

// =======EVENT==========

// =======FUNCTIONS=========
fun init(otw: HOH, ctx: &mut TxContext) {
    let deployer = ctx.sender();
    let admin_cap = AdminCap { id: object::new(ctx) };
    transfer::public_transfer(admin_cap, deployer);

    let (treasury_cap, metadata) = coin::create_currency<HOH>(
        otw,
        DECIMALS,
        SYMBOLS, 
        NAME, 
        DESCRIPTION, 
        option::some(new_unsafe_from_bytes(ICON_URL)), 
        ctx
    );

    // 创建代币控制权
    let treasury_cap = HOHTreasuryCap {
        id: object::new(ctx),
        supply: coin::treasury_into_supply(treasury_cap)
        };

    transfer::share_object(treasury_cap);    
    transfer::public_freeze_object(metadata);
}

public(package) fun hoh_mint(treasury: &mut HOHTreasuryCap,amount: u64,ctx: &mut TxContext): Coin<HOH> {
        coin::from_balance(
            balance::increase_supply(&mut treasury.supply, amount),
            ctx
        )
    }

public(package) fun hoh_burn(treasury: &mut HOHTreasuryCap, payment: Coin<HOH>) {
    let payment_amount = coin::value(&payment);
    assert!(payment_amount > 0, EWrongAmount);
    let payment_balance = coin::into_balance(payment);
    //销毁代币-减少供应量
    balance::decrease_supply(&mut treasury.supply, payment_balance);

}


#[test_only]
public fun init_testing(ctx: &mut TxContext) {
    init(HOH {}, ctx);
}