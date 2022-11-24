// Copyright (c) Aptos
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable @typescript-eslint/naming-convention */
import { deserializeVector, serializeVector } from "../bcs";
import { AccountAddress } from "./account_address";
import { Ed25519PublicKey, Ed25519Signature } from "./ed25519";
import { MultiEd25519PublicKey, MultiEd25519Signature } from "./multi_ed25519";
export class TransactionAuthenticator {
    static deserialize(deserializer) {
        const index = deserializer.deserializeUleb128AsU32();
        switch (index) {
            case 0:
                return TransactionAuthenticatorEd25519.load(deserializer);
            case 1:
                return TransactionAuthenticatorMultiEd25519.load(deserializer);
            case 2:
                return TransactionAuthenticatorMultiAgent.load(deserializer);
            default:
                throw new Error(`Unknown variant index for TransactionAuthenticator: ${index}`);
        }
    }
}
export class TransactionAuthenticatorEd25519 extends TransactionAuthenticator {
    public_key;
    signature;
    /**
     * An authenticator for single signature.
     *
     * @param public_key Client's public key.
     * @param signature Signature of a raw transaction.
     * @see {@link https://aptos.dev/guides/creating-a-signed-transaction/ | Creating a Signed Transaction}
     * for details about generating a signature.
     */
    constructor(public_key, signature) {
        super();
        this.public_key = public_key;
        this.signature = signature;
    }
    serialize(serializer) {
        serializer.serializeU32AsUleb128(0);
        this.public_key.serialize(serializer);
        this.signature.serialize(serializer);
    }
    static load(deserializer) {
        const public_key = Ed25519PublicKey.deserialize(deserializer);
        const signature = Ed25519Signature.deserialize(deserializer);
        return new TransactionAuthenticatorEd25519(public_key, signature);
    }
}
export class TransactionAuthenticatorMultiEd25519 extends TransactionAuthenticator {
    public_key;
    signature;
    /**
     * An authenticator for multiple signatures.
     *
     * @param public_key
     * @param signature
     *
     */
    constructor(public_key, signature) {
        super();
        this.public_key = public_key;
        this.signature = signature;
    }
    serialize(serializer) {
        serializer.serializeU32AsUleb128(1);
        this.public_key.serialize(serializer);
        this.signature.serialize(serializer);
    }
    static load(deserializer) {
        const public_key = MultiEd25519PublicKey.deserialize(deserializer);
        const signature = MultiEd25519Signature.deserialize(deserializer);
        return new TransactionAuthenticatorMultiEd25519(public_key, signature);
    }
}
export class TransactionAuthenticatorMultiAgent extends TransactionAuthenticator {
    sender;
    secondary_signer_addresses;
    secondary_signers;
    constructor(sender, secondary_signer_addresses, secondary_signers) {
        super();
        this.sender = sender;
        this.secondary_signer_addresses = secondary_signer_addresses;
        this.secondary_signers = secondary_signers;
    }
    serialize(serializer) {
        serializer.serializeU32AsUleb128(2);
        this.sender.serialize(serializer);
        serializeVector(this.secondary_signer_addresses, serializer);
        serializeVector(this.secondary_signers, serializer);
    }
    static load(deserializer) {
        const sender = AccountAuthenticator.deserialize(deserializer);
        const secondary_signer_addresses = deserializeVector(deserializer, AccountAddress);
        const secondary_signers = deserializeVector(deserializer, AccountAuthenticator);
        return new TransactionAuthenticatorMultiAgent(sender, secondary_signer_addresses, secondary_signers);
    }
}
export class AccountAuthenticator {
    static deserialize(deserializer) {
        const index = deserializer.deserializeUleb128AsU32();
        switch (index) {
            case 0:
                return AccountAuthenticatorEd25519.load(deserializer);
            case 1:
                return AccountAuthenticatorMultiEd25519.load(deserializer);
            default:
                throw new Error(`Unknown variant index for AccountAuthenticator: ${index}`);
        }
    }
}
export class AccountAuthenticatorEd25519 extends AccountAuthenticator {
    public_key;
    signature;
    constructor(public_key, signature) {
        super();
        this.public_key = public_key;
        this.signature = signature;
    }
    serialize(serializer) {
        serializer.serializeU32AsUleb128(0);
        this.public_key.serialize(serializer);
        this.signature.serialize(serializer);
    }
    static load(deserializer) {
        const public_key = Ed25519PublicKey.deserialize(deserializer);
        const signature = Ed25519Signature.deserialize(deserializer);
        return new AccountAuthenticatorEd25519(public_key, signature);
    }
}
export class AccountAuthenticatorMultiEd25519 extends AccountAuthenticator {
    public_key;
    signature;
    constructor(public_key, signature) {
        super();
        this.public_key = public_key;
        this.signature = signature;
    }
    serialize(serializer) {
        serializer.serializeU32AsUleb128(1);
        this.public_key.serialize(serializer);
        this.signature.serialize(serializer);
    }
    static load(deserializer) {
        const public_key = MultiEd25519PublicKey.deserialize(deserializer);
        const signature = MultiEd25519Signature.deserialize(deserializer);
        return new AccountAuthenticatorMultiEd25519(public_key, signature);
    }
}
