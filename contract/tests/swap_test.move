#[test_only]
module contract::contract_tests;
use contract::swap::{Self,Pool, Seed,WateringEvent};
use contract::hoh::{Self,HOHTreasuryCap};
use sui::test_scenario;
use sui::coin;
use sui::sui::SUI;
use std::debug;
use sui::test_utils::assert_eq;


const USER: address = @0x123;
const USER2: address = @0x456;


#[test]
fun test_swap_sui_to_hoh() {
    let mut scenario_val = test_scenario::begin(USER);
    let scenario = &mut scenario_val;

    //初始化
    {
        swap::init_testing(test_scenario::ctx(scenario));
        hoh::init_testing(test_scenario::ctx(scenario));
    };
    //创建测试对象
    test_scenario::next_tx(scenario, USER);
    {
        let mut pool = test_scenario::take_shared<Pool>(scenario);
        //let mut seed = test_scenario::take_shared<Seed>(scenario);
        let mut treasurycap = test_scenario::take_shared<HOHTreasuryCap>(scenario);
        let coin = coin::mint_for_testing<SUI>(100, test_scenario::ctx(scenario));
        swap::swap_sui_to_hoh(
            &mut treasurycap,
            coin,
            &mut pool,
            test_scenario::ctx(scenario)
        );
        debug::print(&pool);
        test_scenario::return_shared(pool);
        test_scenario::return_shared(treasurycap);

    };
    test_scenario::end(scenario_val);
}

// #[test]
// fun test_swap_hoh_to_sui() {
//     let mut scenario_val = test_scenario::begin(USER);
//     let scenario = &mut scenario_val;

//     //初始化
//     {
//         swap::init_testing(test_scenario::ctx(scenario));
//         hoh::init_testing(test_scenario::ctx(scenario));
//     };
//     //创建测试对象
//     test_scenario::next_tx(scenario, USER);
//     {

//         let mut pool = test_scenario::take_shared<Pool>(scenario);
//         //let mut seed = test_scenario::take_shared<Seed>(scenario);
//         let mut treasurycap = test_scenario::take_shared<HOHTreasuryCap>(scenario);
//         let mut coin = coin::mint_for_testing<SUI>(100, test_scenario::ctx(scenario));

//         //存入池子
//         let hoh_amount = swap::swap_sui_to_hoh(
//             &mut treasurycap,
//             &mut coin,
//             10,
//             &mut pool,
//             test_scenario::ctx(scenario)
//         );
//         debug::print(&pool);

//         let mut hoh_coin = hoh::hoh_mint(&mut treasurycap, 1, test_scenario::ctx(scenario));
//         let sui_amount = swap::swap_hoh_to_sui(
//             &mut treasurycap,
//             &mut hoh_coin,
//             1,
//             &mut pool,
//             test_scenario::ctx(scenario)
//         );

//         debug::print(&sui_amount);
//         test_scenario::return_shared(pool);
//         test_scenario::return_shared(treasurycap);
//         coin::burn_for_testing(coin);
//         coin::burn_for_testing(hoh_coin);

//     };

//     test_scenario::end(scenario_val);
// }

#[test]
fun test_watering(){
    let mut scenario_val = test_scenario::begin(USER);
    let scenario = &mut scenario_val;

    //初始化
    {
        swap::init_testing(test_scenario::ctx(scenario));
        hoh::init_testing(test_scenario::ctx(scenario));
    };
    //创建测试对象
    test_scenario::next_tx(scenario, USER);

    {
        let mut seed = test_scenario::take_shared<Seed>(scenario);
        let mut treasurycap = test_scenario::take_shared<HOHTreasuryCap>(scenario);
        let hoh_coin = hoh::hoh_mint(&mut treasurycap, 100, test_scenario::ctx(scenario));
        swap::watering(
            &mut treasurycap,
            &mut seed,
            hoh_coin,
            test_scenario::ctx(scenario)
        );
        
        debug::print(&seed);
         // 验证事件
        let tx1 = test_scenario::next_tx(scenario, USER);
        assert_eq(test_scenario::num_user_events(&tx1), 1);

        test_scenario::return_shared(seed);
        test_scenario::return_shared(treasurycap);
    };

    //创建测试对象2
    test_scenario::next_tx(scenario, USER2);
    {
        let mut seed = test_scenario::take_shared<Seed>(scenario);
        let mut treasurycap = test_scenario::take_shared<HOHTreasuryCap>(scenario);
        let hoh_coin = hoh::hoh_mint(&mut treasurycap, 1000, test_scenario::ctx(scenario));
        swap::watering(
            &mut treasurycap,
            &mut seed,
            hoh_coin,
            test_scenario::ctx(scenario)
        );
        
        debug::print(&seed);
         // 验证事件
        let tx1 = test_scenario::next_tx(scenario, USER);
        assert_eq(test_scenario::num_user_events(&tx1), 1);

        test_scenario::return_shared(seed);
        test_scenario::return_shared(treasurycap);
    };

    test_scenario::end(scenario_val);
}





