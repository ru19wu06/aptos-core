// Copyright (c) Aptos
// SPDX-License-Identifier: Apache-2.0
import { HexString } from "../hex_string";
import { AccountAddress, Identifier, StructTag, TypeTagAddress, TypeTagBool, TypeTagStruct, TypeTagU128, TypeTagU64, TypeTagU8, TypeTagVector, } from "../aptos_types";
import { Serializer } from "../bcs";
import { argToTransactionArgument, TypeTagParser, serializeArg, ensureBoolean, ensureNumber, ensureBigInt, } from "./builder_utils";
describe("BuilderUtils", () => {
    it("parses a bool TypeTag", async () => {
        expect(new TypeTagParser("bool").parseTypeTag() instanceof TypeTagBool).toBeTruthy();
    });
    it("parses a u8 TypeTag", async () => {
        expect(new TypeTagParser("u8").parseTypeTag() instanceof TypeTagU8).toBeTruthy();
    });
    it("parses a u64 TypeTag", async () => {
        expect(new TypeTagParser("u64").parseTypeTag() instanceof TypeTagU64).toBeTruthy();
    });
    it("parses a u128 TypeTag", async () => {
        expect(new TypeTagParser("u128").parseTypeTag() instanceof TypeTagU128).toBeTruthy();
    });
    it("parses a address TypeTag", async () => {
        expect(new TypeTagParser("address").parseTypeTag() instanceof TypeTagAddress).toBeTruthy();
    });
    it("parses a vector TypeTag", async () => {
        const vectorAddress = new TypeTagParser("vector<address>").parseTypeTag();
        expect(vectorAddress instanceof TypeTagVector).toBeTruthy();
        expect(vectorAddress.value instanceof TypeTagAddress).toBeTruthy();
        const vectorU64 = new TypeTagParser(" vector < u64 > ").parseTypeTag();
        expect(vectorU64 instanceof TypeTagVector).toBeTruthy();
        expect(vectorU64.value instanceof TypeTagU64).toBeTruthy();
    });
    it("parses a sturct TypeTag", async () => {
        const assertStruct = (struct, accountAddress, moduleName, structName) => {
            expect(HexString.fromUint8Array(struct.value.address.address).toShortString()).toBe(accountAddress);
            expect(struct.value.module_name.value).toBe(moduleName);
            expect(struct.value.name.value).toBe(structName);
        };
        const coin = new TypeTagParser("0x1::test_coin::Coin").parseTypeTag();
        expect(coin instanceof TypeTagStruct).toBeTruthy();
        assertStruct(coin, "0x1", "test_coin", "Coin");
        const aptosCoin = new TypeTagParser("0x1::coin::CoinStore < 0x1::test_coin::AptosCoin1 ,  0x1::test_coin::AptosCoin2 > ").parseTypeTag();
        expect(aptosCoin instanceof TypeTagStruct).toBeTruthy();
        assertStruct(aptosCoin, "0x1", "coin", "CoinStore");
        const aptosCoinTrailingComma = new TypeTagParser("0x1::coin::CoinStore < 0x1::test_coin::AptosCoin1 ,  0x1::test_coin::AptosCoin2, > ").parseTypeTag();
        expect(aptosCoinTrailingComma instanceof TypeTagStruct).toBeTruthy();
        assertStruct(aptosCoinTrailingComma, "0x1", "coin", "CoinStore");
        const structTypeTags = aptosCoin.value.type_args;
        expect(structTypeTags.length).toBe(2);
        const structTypeTag1 = structTypeTags[0];
        assertStruct(structTypeTag1, "0x1", "test_coin", "AptosCoin1");
        const structTypeTag2 = structTypeTags[1];
        assertStruct(structTypeTag2, "0x1", "test_coin", "AptosCoin2");
        const coinComplex = new TypeTagParser(
        // eslint-disable-next-line max-len
        "0x1::coin::CoinStore < 0x2::coin::LPCoin < 0x1::test_coin::AptosCoin1 <u8>, vector<0x1::test_coin::AptosCoin2 > > >").parseTypeTag();
        expect(coinComplex instanceof TypeTagStruct).toBeTruthy();
        assertStruct(coinComplex, "0x1", "coin", "CoinStore");
        const coinComplexTypeTag = coinComplex.value.type_args[0];
        assertStruct(coinComplexTypeTag, "0x2", "coin", "LPCoin");
        expect(() => {
            new TypeTagParser("0x1::test_coin").parseTypeTag();
        }).toThrow("Invalid type tag.");
        expect(() => {
            new TypeTagParser("0x1::test_coin::CoinStore<0x1::test_coin::AptosCoin").parseTypeTag();
        }).toThrow("Invalid type tag.");
        expect(() => {
            new TypeTagParser("0x1::test_coin::CoinStore<0x1::test_coin>").parseTypeTag();
        }).toThrow("Invalid type tag.");
        expect(() => {
            new TypeTagParser("0x1:test_coin::AptosCoin").parseTypeTag();
        }).toThrow("Unrecognized token.");
        expect(() => {
            new TypeTagParser("0x!::test_coin::AptosCoin").parseTypeTag();
        }).toThrow("Unrecognized token.");
        expect(() => {
            new TypeTagParser("0x1::test_coin::AptosCoin<").parseTypeTag();
        }).toThrow("Invalid type tag.");
        expect(() => {
            new TypeTagParser("0x1::test_coin::CoinStore<0x1::test_coin::AptosCoin,").parseTypeTag();
        }).toThrow("Invalid type tag.");
        expect(() => {
            new TypeTagParser("").parseTypeTag();
        }).toThrow("Invalid type tag.");
        expect(() => {
            new TypeTagParser("0x1::<::CoinStore<0x1::test_coin::AptosCoin,").parseTypeTag();
        }).toThrow("Invalid type tag.");
        expect(() => {
            new TypeTagParser("0x1::test_coin::><0x1::test_coin::AptosCoin,").parseTypeTag();
        }).toThrow("Invalid type tag.");
        expect(() => {
            new TypeTagParser("u32").parseTypeTag();
        }).toThrow("Invalid type tag.");
    });
    it("serializes a boolean arg", async () => {
        let serializer = new Serializer();
        serializeArg(true, new TypeTagBool(), serializer);
        expect(serializer.getBytes()).toEqual(new Uint8Array([0x01]));
        serializer = new Serializer();
        expect(() => {
            serializeArg(123, new TypeTagBool(), serializer);
        }).toThrow(/Invalid arg/);
    });
    it("serializes a u8 arg", async () => {
        let serializer = new Serializer();
        serializeArg(255, new TypeTagU8(), serializer);
        expect(serializer.getBytes()).toEqual(new Uint8Array([0xff]));
        serializer = new Serializer();
        expect(() => {
            serializeArg("u8", new TypeTagU8(), serializer);
        }).toThrow(/Invalid number string/);
    });
    it("serializes a u64 arg", async () => {
        let serializer = new Serializer();
        serializeArg(BigInt("18446744073709551615"), new TypeTagU64(), serializer);
        expect(serializer.getBytes()).toEqual(new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]));
        serializer = new Serializer();
        expect(() => {
            serializeArg("u64", new TypeTagU64(), serializer);
        }).toThrow(/^Cannot convert/);
    });
    it("serializes a u128 arg", async () => {
        let serializer = new Serializer();
        serializeArg(BigInt("340282366920938463463374607431768211455"), new TypeTagU128(), serializer);
        expect(serializer.getBytes()).toEqual(new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]));
        serializer = new Serializer();
        expect(() => {
            serializeArg("u128", new TypeTagU128(), serializer);
        }).toThrow(/^Cannot convert/);
    });
    it("serializes an AccountAddress arg", async () => {
        let serializer = new Serializer();
        serializeArg("0x1", new TypeTagAddress(), serializer);
        expect(HexString.fromUint8Array(serializer.getBytes()).toShortString()).toEqual("0x1");
        serializer = new Serializer();
        serializeArg(AccountAddress.fromHex("0x1"), new TypeTagAddress(), serializer);
        expect(HexString.fromUint8Array(serializer.getBytes()).toShortString()).toEqual("0x1");
        serializer = new Serializer();
        expect(() => {
            serializeArg(123456, new TypeTagAddress(), serializer);
        }).toThrow("Invalid account address.");
    });
    it("serializes a vector arg", async () => {
        let serializer = new Serializer();
        serializeArg([255], new TypeTagVector(new TypeTagU8()), serializer);
        expect(serializer.getBytes()).toEqual(new Uint8Array([0x1, 0xff]));
        serializer = new Serializer();
        serializeArg("abc", new TypeTagVector(new TypeTagU8()), serializer);
        expect(serializer.getBytes()).toEqual(new Uint8Array([0x3, 0x61, 0x62, 0x63]));
        serializer = new Serializer();
        serializeArg(new Uint8Array([0x61, 0x62, 0x63]), new TypeTagVector(new TypeTagU8()), serializer);
        expect(serializer.getBytes()).toEqual(new Uint8Array([0x3, 0x61, 0x62, 0x63]));
        serializer = new Serializer();
        expect(() => {
            serializeArg(123456, new TypeTagVector(new TypeTagU8()), serializer);
        }).toThrow("Invalid vector args.");
    });
    it("serializes a struct arg", async () => {
        let serializer = new Serializer();
        serializeArg("abc", new TypeTagStruct(new StructTag(AccountAddress.fromHex("0x1"), new Identifier("string"), new Identifier("String"), [])), serializer);
        expect(serializer.getBytes()).toEqual(new Uint8Array([0x3, 0x61, 0x62, 0x63]));
        serializer = new Serializer();
        expect(() => {
            serializeArg("abc", new TypeTagStruct(new StructTag(AccountAddress.fromHex("0x3"), new Identifier("token"), new Identifier("Token"), [])), serializer);
        }).toThrow("The only supported struct arg is of type 0x1::string::String");
    });
    it("throws at unrecognized arg types", async () => {
        const serializer = new Serializer();
        expect(() => {
            // @ts-ignore
            serializeArg(123456, "unknown_type", serializer);
        }).toThrow("Unsupported arg type.");
    });
    it("converts a boolean TransactionArgument", async () => {
        const res = argToTransactionArgument(true, new TypeTagBool());
        expect(res.value).toEqual(true);
        expect(() => {
            argToTransactionArgument(123, new TypeTagBool());
        }).toThrow(/Invalid arg/);
    });
    it("converts a u8 TransactionArgument", async () => {
        const res = argToTransactionArgument(123, new TypeTagU8());
        expect(res.value).toEqual(123);
        expect(() => {
            argToTransactionArgument("u8", new TypeTagBool());
        }).toThrow(/Invalid boolean string/);
    });
    it("converts a u64 TransactionArgument", async () => {
        const res = argToTransactionArgument(123, new TypeTagU64());
        expect(res.value).toEqual(BigInt(123));
        expect(() => {
            argToTransactionArgument("u64", new TypeTagU64());
        }).toThrow(/Cannot convert/);
    });
    it("converts a u128 TransactionArgument", async () => {
        const res = argToTransactionArgument(123, new TypeTagU128());
        expect(res.value).toEqual(BigInt(123));
        expect(() => {
            argToTransactionArgument("u128", new TypeTagU128());
        }).toThrow(/Cannot convert/);
    });
    it("converts an AccountAddress TransactionArgument", async () => {
        let res = argToTransactionArgument("0x1", new TypeTagAddress());
        expect(HexString.fromUint8Array(res.value.address).toShortString()).toEqual("0x1");
        res = argToTransactionArgument(AccountAddress.fromHex("0x2"), new TypeTagAddress());
        expect(HexString.fromUint8Array(res.value.address).toShortString()).toEqual("0x2");
        expect(() => {
            argToTransactionArgument(123456, new TypeTagAddress());
        }).toThrow("Invalid account address.");
    });
    it("converts a vector TransactionArgument", async () => {
        const res = argToTransactionArgument(new Uint8Array([0x1]), new TypeTagVector(new TypeTagU8()));
        expect(res.value).toEqual(new Uint8Array([0x1]));
        expect(() => {
            argToTransactionArgument(123456, new TypeTagVector(new TypeTagU8()));
        }).toThrow(/.*should be an instance of Uint8Array$/);
    });
    it("throws at unrecognized TransactionArgument types", async () => {
        expect(() => {
            // @ts-ignore
            argToTransactionArgument(123456, "unknown_type");
        }).toThrow("Unknown type for TransactionArgument.");
    });
    it("ensures a boolean", async () => {
        expect(ensureBoolean(false)).toBe(false);
        expect(ensureBoolean(true)).toBe(true);
        expect(ensureBoolean("true")).toBe(true);
        expect(ensureBoolean("false")).toBe(false);
        expect(() => ensureBoolean("True")).toThrow("Invalid boolean string.");
    });
    it("ensures a number", async () => {
        expect(ensureNumber(10)).toBe(10);
        expect(ensureNumber("123")).toBe(123);
        expect(() => ensureNumber("True")).toThrow("Invalid number string.");
    });
    it("ensures a bigint", async () => {
        expect(ensureBigInt(10)).toBe(BigInt(10));
        expect(ensureBigInt("123")).toBe(BigInt(123));
        expect(() => ensureBigInt("True")).toThrow(/^Cannot convert/);
    });
});
