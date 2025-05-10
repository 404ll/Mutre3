module contract::water;

// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions

use sui::{
    coin::{Self, TreasuryCap},
    token::{Self, TokenPolicy, Token},
    event::emit,
    url::new_unsafe_from_bytes
};

const DECIMALS: u8 = 0;
const SYMBOLS: vector<u8> = b"WATER";
const NAME: vector<u8> = b"Water";
const DESCRIPTION: vector<u8> = b"Fueling the Last Seed. Reviving the Chain.";
const ICON_URL: vector<u8> = b"https://github.com/404ll/My-images/blob/main/img/image.png"; 

// =======ERROR=========
const EWrongAmount: u64 = 0;

// =======STRUCT=========
public struct WATER has drop {}
public struct AdminCap has key, store {
    id: UID,
}
public struct WATERTokenCap has key {
    id: UID,
    cap: TreasuryCap<WATER>,
}

// =======EVENT==========
public struct WateringEvent has copy, drop {
    owner: address,
    amount: u64,
}

// =======FUNCTIONS=========
fun init(otw: WATER, ctx: &mut TxContext) {
    let deployer = ctx.sender();
    let admin_cap = AdminCap { id: object::new(ctx) };
    transfer::public_transfer(admin_cap, deployer);

    let (treasury_cap, metadata) = coin::create_currency<WATER>(
        otw,
        DECIMALS,
        SYMBOLS, 
        NAME, 
        DESCRIPTION, 
        option::some(new_unsafe_from_bytes(ICON_URL)), 
        ctx
    );

    let (mut policy, cap) = token::new_policy<WATER>(
        &treasury_cap, ctx
    );

    let token_cap = WATERTokenCap {
        id: object::new(ctx),
        cap: treasury_cap,
    };
    
    token::allow(&mut policy, &cap, token::spend_action(), ctx);
    token::share_policy<WATER>(policy);
    transfer::share_object(token_cap);
    transfer::public_transfer(cap, deployer);
    transfer::public_freeze_object(metadata);
}



public(package) fun watering(
    payment: Token<WATER>,
    amount: u64,
    token_prolicy: &mut TokenPolicy<WATER>,
    ctx: &mut TxContext
) {
    assert!(token::value<WATER>(&payment) == amount, EWrongAmount);
    let req = token::spend(payment, ctx);
    token::confirm_request_mut(token_prolicy, req, ctx);
    emit(WateringEvent {
        owner: ctx.sender(),
        amount: amount,
    });
}

// ------ Admin Functions ---------
// for token::flush 
public fun treasury_borrow_mut(
    _admin: &AdminCap,
    tad_token_cap: &mut WATERTokenCap,
): &mut TreasuryCap<WATER> {
    &mut tad_token_cap.cap
}