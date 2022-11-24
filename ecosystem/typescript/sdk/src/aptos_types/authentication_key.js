// Copyright (c) Aptos
// SPDX-License-Identifier: Apache-2.0
import { sha3_256 as sha3Hash } from "@noble/hashes/sha3";
import { HexString } from "../hex_string";
/**
 * Each account stores an authentication key. Authentication key enables account owners to rotate
 * their private key(s) associated with the account without changing the address that hosts their account.
 * @see {@link * https://aptos.dev/concepts/accounts | Account Basics}
 *
 * Account addresses can be derived from AuthenticationKey
 */
export class AuthenticationKey {
    static LENGTH = 32;
    static MULTI_ED25519_SCHEME = 1;
    static ED25519_SCHEME = 0;
    static DERIVE_RESOURCE_ACCOUNT_SCHEME = 255;
    bytes;
    constructor(bytes) {
        if (bytes.length !== AuthenticationKey.LENGTH) {
            throw new Error("Expected a byte array of length 32");
        }
        this.bytes = bytes;
    }
    /**
     * Converts a K-of-N MultiEd25519PublicKey to AuthenticationKey with:
     * `auth_key = sha3-256(p_1 | … | p_n | K | 0x01)`. `K` represents the K-of-N required for
     * authenticating the transaction. `0x01` is the 1-byte scheme for multisig.
     */
    static fromMultiEd25519PublicKey(publicKey) {
        const pubKeyBytes = publicKey.toBytes();
        const bytes = new Uint8Array(pubKeyBytes.length + 1);
        bytes.set(pubKeyBytes);
        bytes.set([AuthenticationKey.MULTI_ED25519_SCHEME], pubKeyBytes.length);
        const hash = sha3Hash.create();
        hash.update(bytes);
        return new AuthenticationKey(hash.digest());
    }
    static fromEd25519PublicKey(publicKey) {
        const pubKeyBytes = publicKey.value;
        const bytes = new Uint8Array(pubKeyBytes.length + 1);
        bytes.set(pubKeyBytes);
        bytes.set([AuthenticationKey.ED25519_SCHEME], pubKeyBytes.length);
        const hash = sha3Hash.create();
        hash.update(bytes);
        return new AuthenticationKey(hash.digest());
    }
    /**
     * Derives an account address from AuthenticationKey. Since current AccountAddress is 32 bytes,
     * AuthenticationKey bytes are directly translated to AccountAddress.
     */
    derivedAddress() {
        return HexString.fromUint8Array(this.bytes);
    }
}
