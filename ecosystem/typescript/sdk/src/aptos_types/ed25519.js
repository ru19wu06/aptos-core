// Copyright (c) Aptos
// SPDX-License-Identifier: Apache-2.0
export class Ed25519PublicKey {
    static LENGTH = 32;
    value;
    constructor(value) {
        if (value.length !== Ed25519PublicKey.LENGTH) {
            throw new Error(`Ed25519PublicKey length should be ${Ed25519PublicKey.LENGTH}`);
        }
        this.value = value;
    }
    toBytes() {
        return this.value;
    }
    serialize(serializer) {
        serializer.serializeBytes(this.value);
    }
    static deserialize(deserializer) {
        const value = deserializer.deserializeBytes();
        return new Ed25519PublicKey(value);
    }
}
export class Ed25519Signature {
    value;
    static LENGTH = 64;
    constructor(value) {
        this.value = value;
        if (value.length !== Ed25519Signature.LENGTH) {
            throw new Error(`Ed25519Signature length should be ${Ed25519Signature.LENGTH}`);
        }
    }
    serialize(serializer) {
        serializer.serializeBytes(this.value);
    }
    static deserialize(deserializer) {
        const value = deserializer.deserializeBytes();
        return new Ed25519Signature(value);
    }
}
