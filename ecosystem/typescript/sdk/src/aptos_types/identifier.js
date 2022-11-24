// Copyright (c) Aptos
// SPDX-License-Identifier: Apache-2.0
export class Identifier {
    value;
    constructor(value) {
        this.value = value;
    }
    serialize(serializer) {
        serializer.serializeStr(this.value);
    }
    static deserialize(deserializer) {
        const value = deserializer.deserializeStr();
        return new Identifier(value);
    }
}
