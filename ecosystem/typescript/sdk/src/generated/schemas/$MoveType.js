/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $MoveType = {
    type: 'string',
    description: `String representation of an on-chain Move type tag that is exposed in transaction payload.
    Values:
    - bool
    - u8
    - u64
    - u128
    - address
    - signer
    - vector: \`vector<{non-reference MoveTypeId}>\`
    - struct: \`{address}::{module_name}::{struct_name}::<{generic types}>\`

    Vector type value examples:
    - \`vector<u8>\`
    - \`vector<vector<u64>>\`
    - \`vector<0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>>\`

    Struct type value examples:
    - \`0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>
    - \`0x1::account::Account\`

    Note:
    1. Empty chars should be ignored when comparing 2 struct tag ids.
    2. When used in an URL path, should be encoded by url-encoding (AKA percent-encoding).
    `,
    pattern: '^(bool|u8|u64|u128|address|signer|vector<.+>|0x[0-9a-zA-Z:_<, >]+)$',
};
