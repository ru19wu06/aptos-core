// Copyright (c) Aptos
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
import { deserializeVector, serializeVector } from "../bcs";
import { AccountAddress } from "./account_address";
import { Identifier } from "./identifier";
export class TypeTag {
    static deserialize(deserializer) {
        const index = deserializer.deserializeUleb128AsU32();
        switch (index) {
            case 0:
                return TypeTagBool.load(deserializer);
            case 1:
                return TypeTagU8.load(deserializer);
            case 2:
                return TypeTagU64.load(deserializer);
            case 3:
                return TypeTagU128.load(deserializer);
            case 4:
                return TypeTagAddress.load(deserializer);
            case 5:
                return TypeTagSigner.load(deserializer);
            case 6:
                return TypeTagVector.load(deserializer);
            case 7:
                return TypeTagStruct.load(deserializer);
            default:
                throw new Error(`Unknown variant index for TypeTag: ${index}`);
        }
    }
}
export class TypeTagBool extends TypeTag {
    serialize(serializer) {
        serializer.serializeU32AsUleb128(0);
    }
    static load(deserializer) {
        return new TypeTagBool();
    }
}
export class TypeTagU8 extends TypeTag {
    serialize(serializer) {
        serializer.serializeU32AsUleb128(1);
    }
    static load(_deserializer) {
        return new TypeTagU8();
    }
}
export class TypeTagU64 extends TypeTag {
    serialize(serializer) {
        serializer.serializeU32AsUleb128(2);
    }
    static load(_deserializer) {
        return new TypeTagU64();
    }
}
export class TypeTagU128 extends TypeTag {
    serialize(serializer) {
        serializer.serializeU32AsUleb128(3);
    }
    static load(_deserializer) {
        return new TypeTagU128();
    }
}
export class TypeTagAddress extends TypeTag {
    serialize(serializer) {
        serializer.serializeU32AsUleb128(4);
    }
    static load(_deserializer) {
        return new TypeTagAddress();
    }
}
export class TypeTagSigner extends TypeTag {
    serialize(serializer) {
        serializer.serializeU32AsUleb128(5);
    }
    static load(_deserializer) {
        return new TypeTagSigner();
    }
}
export class TypeTagVector extends TypeTag {
    value;
    constructor(value) {
        super();
        this.value = value;
    }
    serialize(serializer) {
        serializer.serializeU32AsUleb128(6);
        this.value.serialize(serializer);
    }
    static load(deserializer) {
        const value = TypeTag.deserialize(deserializer);
        return new TypeTagVector(value);
    }
}
export class TypeTagStruct extends TypeTag {
    value;
    constructor(value) {
        super();
        this.value = value;
    }
    serialize(serializer) {
        serializer.serializeU32AsUleb128(7);
        this.value.serialize(serializer);
    }
    static load(deserializer) {
        const value = StructTag.deserialize(deserializer);
        return new TypeTagStruct(value);
    }
    isStringTypeTag() {
        if (this.value.module_name.value === "string" &&
            this.value.name.value === "String" &&
            this.value.address === AccountAddress.fromHex("0x1")) {
            return true;
        }
        return false;
    }
}
export class StructTag {
    address;
    module_name;
    name;
    type_args;
    constructor(address, module_name, name, type_args) {
        this.address = address;
        this.module_name = module_name;
        this.name = name;
        this.type_args = type_args;
    }
    /**
     * Converts a string literal to a StructTag
     * @param structTag String literal in format "AcountAddress::module_name::ResourceName",
     *   e.g. "0x1::aptos_coin::AptosCoin"
     * @returns
     */
    static fromString(structTag) {
        // Type args are not supported in string literal
        if (structTag.includes("<")) {
            throw new Error("Not implemented");
        }
        const parts = structTag.split("::");
        if (parts.length !== 3) {
            throw new Error("Invalid struct tag string literal.");
        }
        return new StructTag(AccountAddress.fromHex(parts[0]), new Identifier(parts[1]), new Identifier(parts[2]), []);
    }
    serialize(serializer) {
        this.address.serialize(serializer);
        this.module_name.serialize(serializer);
        this.name.serialize(serializer);
        serializeVector(this.type_args, serializer);
    }
    static deserialize(deserializer) {
        const address = AccountAddress.deserialize(deserializer);
        const moduleName = Identifier.deserialize(deserializer);
        const name = Identifier.deserialize(deserializer);
        const typeArgs = deserializeVector(deserializer, TypeTag);
        return new StructTag(address, moduleName, name, typeArgs);
    }
}
