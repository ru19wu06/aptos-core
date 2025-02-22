// Copyright (c) Aptos
// SPDX-License-Identifier: Apache-2.0
import { HexString } from "../hex_string";
import { TypeTagBool, TypeTagU8, TypeTagU64, TypeTagU128, TypeTagAddress, AccountAddress, TypeTagVector, TypeTagStruct, StructTag, Identifier, TransactionArgumentBool, TransactionArgumentU64, TransactionArgumentU128, TransactionArgumentAddress, TransactionArgumentU8, TransactionArgumentU8Vector, } from "../aptos_types";
function assertType(val, types, message) {
    if (!types?.includes(typeof val)) {
        throw new Error(message || `Invalid arg: ${val} type should be ${types instanceof Array ? types.join(" or ") : types}`);
    }
}
function bail(message) {
    throw new Error(message);
}
function isWhiteSpace(c) {
    if (c.match(/\s/)) {
        return true;
    }
    return false;
}
function isValidAlphabetic(c) {
    if (c.match(/[_A-Za-z0-9]/g)) {
        return true;
    }
    return false;
}
// Returns Token and Token byte size
function nextToken(tagStr, pos) {
    const c = tagStr[pos];
    if (c === ":") {
        if (tagStr.slice(pos, pos + 2) === "::") {
            return [["COLON", "::"], 2];
        }
        bail("Unrecognized token.");
    }
    else if (c === "<") {
        return [["LT", "<"], 1];
    }
    else if (c === ">") {
        return [["GT", ">"], 1];
    }
    else if (c === ",") {
        return [["COMMA", ","], 1];
    }
    else if (isWhiteSpace(c)) {
        let res = "";
        for (let i = pos; i < tagStr.length; i += 1) {
            const char = tagStr[i];
            if (isWhiteSpace(char)) {
                res = `${res}${char}`;
            }
            else {
                break;
            }
        }
        return [["SPACE", res], res.length];
    }
    else if (isValidAlphabetic(c)) {
        let res = "";
        for (let i = pos; i < tagStr.length; i += 1) {
            const char = tagStr[i];
            if (isValidAlphabetic(char)) {
                res = `${res}${char}`;
            }
            else {
                break;
            }
        }
        return [["IDENT", res], res.length];
    }
    throw new Error("Unrecognized token.");
}
function tokenize(tagStr) {
    let pos = 0;
    const tokens = [];
    while (pos < tagStr.length) {
        const [token, size] = nextToken(tagStr, pos);
        if (token[0] !== "SPACE") {
            tokens.push(token);
        }
        pos += size;
    }
    return tokens;
}
/**
 * Parser to parse a type tag string
 */
export class TypeTagParser {
    tokens;
    constructor(tagStr) {
        this.tokens = tokenize(tagStr);
    }
    consume(targetToken) {
        const token = this.tokens.shift();
        if (!token || token[1] !== targetToken) {
            bail("Invalid type tag.");
        }
    }
    parseCommaList(endToken, allowTraillingComma) {
        const res = [];
        if (this.tokens.length <= 0) {
            bail("Invalid type tag.");
        }
        while (this.tokens[0][1] !== endToken) {
            res.push(this.parseTypeTag());
            if (this.tokens.length > 0 && this.tokens[0][1] === endToken) {
                break;
            }
            this.consume(",");
            if (this.tokens.length > 0 && this.tokens[0][1] === endToken && allowTraillingComma) {
                break;
            }
            if (this.tokens.length <= 0) {
                bail("Invalid type tag.");
            }
        }
        return res;
    }
    parseTypeTag() {
        if (this.tokens.length === 0) {
            bail("Invalid type tag.");
        }
        // Pop left most element out
        const [tokenTy, tokenVal] = this.tokens.shift();
        if (tokenVal === "u8") {
            return new TypeTagU8();
        }
        if (tokenVal === "u64") {
            return new TypeTagU64();
        }
        if (tokenVal === "u128") {
            return new TypeTagU128();
        }
        if (tokenVal === "bool") {
            return new TypeTagBool();
        }
        if (tokenVal === "address") {
            return new TypeTagAddress();
        }
        if (tokenVal === "vector") {
            this.consume("<");
            const res = this.parseTypeTag();
            this.consume(">");
            return new TypeTagVector(res);
        }
        if (tokenTy === "IDENT" && (tokenVal.startsWith("0x") || tokenVal.startsWith("0X"))) {
            const address = tokenVal;
            this.consume("::");
            const [moduleTokenTy, module] = this.tokens.shift();
            if (moduleTokenTy !== "IDENT") {
                bail("Invalid type tag.");
            }
            this.consume("::");
            const [nameTokenTy, name] = this.tokens.shift();
            if (nameTokenTy !== "IDENT") {
                bail("Invalid type tag.");
            }
            let tyTags = [];
            // Check if the struct has ty args
            if (this.tokens.length > 0 && this.tokens[0][1] === "<") {
                this.consume("<");
                tyTags = this.parseCommaList(">", true);
                this.consume(">");
            }
            const structTag = new StructTag(AccountAddress.fromHex(address), new Identifier(module), new Identifier(name), tyTags);
            return new TypeTagStruct(structTag);
        }
        throw new Error("Invalid type tag.");
    }
}
export function ensureBoolean(val) {
    assertType(val, ["boolean", "string"]);
    if (typeof val === "boolean") {
        return val;
    }
    if (val === "true") {
        return true;
    }
    if (val === "false") {
        return false;
    }
    throw new Error("Invalid boolean string.");
}
export function ensureNumber(val) {
    assertType(val, ["number", "string"]);
    if (typeof val === "number") {
        return val;
    }
    const res = Number.parseInt(val, 10);
    if (Number.isNaN(res)) {
        throw new Error("Invalid number string.");
    }
    return res;
}
export function ensureBigInt(val) {
    assertType(val, ["number", "bigint", "string"]);
    return BigInt(val);
}
export function serializeArg(argVal, argType, serializer) {
    if (argType instanceof TypeTagBool) {
        serializer.serializeBool(ensureBoolean(argVal));
        return;
    }
    if (argType instanceof TypeTagU8) {
        serializer.serializeU8(ensureNumber(argVal));
        return;
    }
    if (argType instanceof TypeTagU64) {
        serializer.serializeU64(ensureBigInt(argVal));
        return;
    }
    if (argType instanceof TypeTagU128) {
        serializer.serializeU128(ensureBigInt(argVal));
        return;
    }
    if (argType instanceof TypeTagAddress) {
        let addr;
        if (typeof argVal === "string" || argVal instanceof HexString) {
            addr = AccountAddress.fromHex(argVal);
        }
        else if (argVal instanceof AccountAddress) {
            addr = argVal;
        }
        else {
            throw new Error("Invalid account address.");
        }
        addr.serialize(serializer);
        return;
    }
    if (argType instanceof TypeTagVector) {
        // We are serializing a vector<u8>
        if (argType.value instanceof TypeTagU8) {
            if (argVal instanceof Uint8Array) {
                serializer.serializeBytes(argVal);
                return;
            }
            if (typeof argVal === "string") {
                serializer.serializeStr(argVal);
                return;
            }
        }
        if (!(argVal instanceof Array)) {
            throw new Error("Invalid vector args.");
        }
        serializer.serializeU32AsUleb128(argVal.length);
        argVal.forEach((arg) => serializeArg(arg, argType.value, serializer));
        return;
    }
    if (argType instanceof TypeTagStruct) {
        const { address, module_name: moduleName, name } = argType.value;
        if (`${HexString.fromUint8Array(address.address).toShortString()}::${moduleName.value}::${name.value}` !==
            "0x1::string::String") {
            throw new Error("The only supported struct arg is of type 0x1::string::String");
        }
        assertType(argVal, ["string"]);
        serializer.serializeStr(argVal);
        return;
    }
    throw new Error("Unsupported arg type.");
}
export function argToTransactionArgument(argVal, argType) {
    if (argType instanceof TypeTagBool) {
        return new TransactionArgumentBool(ensureBoolean(argVal));
    }
    if (argType instanceof TypeTagU8) {
        return new TransactionArgumentU8(ensureNumber(argVal));
    }
    if (argType instanceof TypeTagU64) {
        return new TransactionArgumentU64(ensureBigInt(argVal));
    }
    if (argType instanceof TypeTagU128) {
        return new TransactionArgumentU128(ensureBigInt(argVal));
    }
    if (argType instanceof TypeTagAddress) {
        let addr;
        if (typeof argVal === "string" || argVal instanceof HexString) {
            addr = AccountAddress.fromHex(argVal);
        }
        else if (argVal instanceof AccountAddress) {
            addr = argVal;
        }
        else {
            throw new Error("Invalid account address.");
        }
        return new TransactionArgumentAddress(addr);
    }
    if (argType instanceof TypeTagVector && argType.value instanceof TypeTagU8) {
        if (!(argVal instanceof Uint8Array)) {
            throw new Error(`${argVal} should be an instance of Uint8Array`);
        }
        return new TransactionArgumentU8Vector(argVal);
    }
    throw new Error("Unknown type for TransactionArgument.");
}
