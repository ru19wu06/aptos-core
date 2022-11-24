// Copyright (c) Aptos
// SPDX-License-Identifier: Apache-2.0
import { Serializer } from "./serializer";
/**
 * Serializes a vector values that are "Serializable".
 */
export function serializeVector(value, serializer) {
    serializer.serializeU32AsUleb128(value.length);
    value.forEach((item) => {
        item.serialize(serializer);
    });
}
/**
 * Serializes a vector with specified item serializaiton function.
 * Very dynamic function and bypasses static typechecking.
 */
export function serializeVectorWithFunc(value, func) {
    const serializer = new Serializer();
    serializer.serializeU32AsUleb128(value.length);
    const f = serializer[func];
    value.forEach((item) => {
        f.call(serializer, item);
    });
    return serializer.getBytes();
}
/**
 * Deserializes a vector of values.
 */
export function deserializeVector(deserializer, cls) {
    const length = deserializer.deserializeUleb128AsU32();
    const list = [];
    for (let i = 0; i < length; i += 1) {
        list.push(cls.deserialize(deserializer));
    }
    return list;
}
export function bcsToBytes(value) {
    const serializer = new Serializer();
    value.serialize(serializer);
    return serializer.getBytes();
}
export function bcsSerializeUint64(value) {
    const serializer = new Serializer();
    serializer.serializeU64(value);
    return serializer.getBytes();
}
export function bcsSerializeU8(value) {
    const serializer = new Serializer();
    serializer.serializeU8(value);
    return serializer.getBytes();
}
export function bcsSerializeU16(value) {
    const serializer = new Serializer();
    serializer.serializeU16(value);
    return serializer.getBytes();
}
export function bcsSerializeU32(value) {
    const serializer = new Serializer();
    serializer.serializeU32(value);
    return serializer.getBytes();
}
export function bcsSerializeU128(value) {
    const serializer = new Serializer();
    serializer.serializeU128(value);
    return serializer.getBytes();
}
export function bcsSerializeBool(value) {
    const serializer = new Serializer();
    serializer.serializeBool(value);
    return serializer.getBytes();
}
export function bcsSerializeStr(value) {
    const serializer = new Serializer();
    serializer.serializeStr(value);
    return serializer.getBytes();
}
export function bcsSerializeBytes(value) {
    const serializer = new Serializer();
    serializer.serializeBytes(value);
    return serializer.getBytes();
}
export function bcsSerializeFixedBytes(value) {
    const serializer = new Serializer();
    serializer.serializeFixedBytes(value);
    return serializer.getBytes();
}
