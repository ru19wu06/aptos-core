// Copyright (c) Aptos
// SPDX-License-Identifier: Apache-2.0
import { deserializeVector, serializeVector } from "../bcs";
import { ModuleId } from "./transaction";
import { TypeTag } from "./type_tag";
export class TypeArgumentABI {
    name;
    /**
     * Constructs a TypeArgumentABI instance.
     * @param name
     */
    constructor(name) {
        this.name = name;
    }
    serialize(serializer) {
        serializer.serializeStr(this.name);
    }
    static deserialize(deserializer) {
        const name = deserializer.deserializeStr();
        return new TypeArgumentABI(name);
    }
}
export class ArgumentABI {
    name;
    type_tag;
    /**
     * Constructs an ArgumentABI instance.
     * @param name
     * @param type_tag
     */
    constructor(name, type_tag) {
        this.name = name;
        this.type_tag = type_tag;
    }
    serialize(serializer) {
        serializer.serializeStr(this.name);
        this.type_tag.serialize(serializer);
    }
    static deserialize(deserializer) {
        const name = deserializer.deserializeStr();
        const typeTag = TypeTag.deserialize(deserializer);
        return new ArgumentABI(name, typeTag);
    }
}
export class ScriptABI {
    static deserialize(deserializer) {
        const index = deserializer.deserializeUleb128AsU32();
        switch (index) {
            case 0:
                return TransactionScriptABI.load(deserializer);
            case 1:
                return EntryFunctionABI.load(deserializer);
            default:
                throw new Error(`Unknown variant index for TransactionPayload: ${index}`);
        }
    }
}
export class TransactionScriptABI extends ScriptABI {
    name;
    doc;
    code;
    ty_args;
    args;
    /**
     * Constructs a TransactionScriptABI instance.
     * @param name Entry function name
     * @param doc
     * @param code
     * @param ty_args
     * @param args
     */
    constructor(name, doc, code, ty_args, args) {
        super();
        this.name = name;
        this.doc = doc;
        this.code = code;
        this.ty_args = ty_args;
        this.args = args;
    }
    serialize(serializer) {
        serializer.serializeU32AsUleb128(0);
        serializer.serializeStr(this.name);
        serializer.serializeStr(this.doc);
        serializer.serializeBytes(this.code);
        serializeVector(this.ty_args, serializer);
        serializeVector(this.args, serializer);
    }
    static load(deserializer) {
        const name = deserializer.deserializeStr();
        const doc = deserializer.deserializeStr();
        const code = deserializer.deserializeBytes();
        const tyArgs = deserializeVector(deserializer, TypeArgumentABI);
        const args = deserializeVector(deserializer, ArgumentABI);
        return new TransactionScriptABI(name, doc, code, tyArgs, args);
    }
}
export class EntryFunctionABI extends ScriptABI {
    name;
    module_name;
    doc;
    ty_args;
    args;
    /**
     * Constructs a EntryFunctionABI instance
     * @param name
     * @param module_name Fully qualified module id
     * @param doc
     * @param ty_args
     * @param args
     */
    constructor(name, module_name, doc, ty_args, args) {
        super();
        this.name = name;
        this.module_name = module_name;
        this.doc = doc;
        this.ty_args = ty_args;
        this.args = args;
    }
    serialize(serializer) {
        serializer.serializeU32AsUleb128(1);
        serializer.serializeStr(this.name);
        this.module_name.serialize(serializer);
        serializer.serializeStr(this.doc);
        serializeVector(this.ty_args, serializer);
        serializeVector(this.args, serializer);
    }
    static load(deserializer) {
        const name = deserializer.deserializeStr();
        const moduleName = ModuleId.deserialize(deserializer);
        const doc = deserializer.deserializeStr();
        const tyArgs = deserializeVector(deserializer, TypeArgumentABI);
        const args = deserializeVector(deserializer, ArgumentABI);
        return new EntryFunctionABI(name, moduleName, doc, tyArgs, args);
    }
}
