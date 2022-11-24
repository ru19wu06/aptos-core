// Copyright (c) Aptos
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-classes-per-file */
import { sha3_256 as sha3Hash } from "@noble/hashes/sha3";
import { HexString } from "../hex_string";
import { deserializeVector, serializeVector, bcsToBytes, } from "../bcs";
import { AccountAddress } from "./account_address";
import { TransactionAuthenticator } from "./authenticator";
import { Identifier } from "./identifier";
import { TypeTag } from "./type_tag";
export class RawTransaction {
    sender;
    sequence_number;
    payload;
    max_gas_amount;
    gas_unit_price;
    expiration_timestamp_secs;
    chain_id;
    /**
     * RawTransactions contain the metadata and payloads that can be submitted to Aptos chain for execution.
     * RawTransactions must be signed before Aptos chain can execute them.
     *
     * @param sender Account address of the sender.
     * @param sequence_number Sequence number of this transaction. This must match the sequence number stored in
     *   the sender's account at the time the transaction executes.
     * @param payload Instructions for the Aptos Blockchain, including publishing a module,
     *   execute a entry function or execute a script payload.
     * @param max_gas_amount Maximum total gas to spend for this transaction. The account must have more
     *   than this gas or the transaction will be discarded during validation.
     * @param gas_unit_price Price to be paid per gas unit.
     * @param expiration_timestamp_secs The blockchain timestamp at which the blockchain would discard this transaction.
     * @param chain_id The chain ID of the blockchain that this transaction is intended to be run on.
     */
    constructor(sender, sequence_number, payload, max_gas_amount, gas_unit_price, expiration_timestamp_secs, chain_id) {
        this.sender = sender;
        this.sequence_number = sequence_number;
        this.payload = payload;
        this.max_gas_amount = max_gas_amount;
        this.gas_unit_price = gas_unit_price;
        this.expiration_timestamp_secs = expiration_timestamp_secs;
        this.chain_id = chain_id;
    }
    serialize(serializer) {
        this.sender.serialize(serializer);
        serializer.serializeU64(this.sequence_number);
        this.payload.serialize(serializer);
        serializer.serializeU64(this.max_gas_amount);
        serializer.serializeU64(this.gas_unit_price);
        serializer.serializeU64(this.expiration_timestamp_secs);
        this.chain_id.serialize(serializer);
    }
    static deserialize(deserializer) {
        const sender = AccountAddress.deserialize(deserializer);
        const sequence_number = deserializer.deserializeU64();
        const payload = TransactionPayload.deserialize(deserializer);
        const max_gas_amount = deserializer.deserializeU64();
        const gas_unit_price = deserializer.deserializeU64();
        const expiration_timestamp_secs = deserializer.deserializeU64();
        const chain_id = ChainId.deserialize(deserializer);
        return new RawTransaction(sender, sequence_number, payload, max_gas_amount, gas_unit_price, expiration_timestamp_secs, chain_id);
    }
}
export class Script {
    code;
    ty_args;
    args;
    /**
     * Scripts contain the Move bytecodes payload that can be submitted to Aptos chain for execution.
     * @param code Move bytecode
     * @param ty_args Type arguments that bytecode requires.
     *
     * @example
     * A coin transfer function has one type argument "CoinType".
     * ```
     * public(script) fun transfer<CoinType>(from: &signer, to: address, amount: u64,)
     * ```
     * @param args Arugments to bytecode function.
     *
     * @example
     * A coin transfer function has three arugments "from", "to" and "amount".
     * ```
     * public(script) fun transfer<CoinType>(from: &signer, to: address, amount: u64,)
     * ```
     */
    constructor(code, ty_args, args) {
        this.code = code;
        this.ty_args = ty_args;
        this.args = args;
    }
    serialize(serializer) {
        serializer.serializeBytes(this.code);
        serializeVector(this.ty_args, serializer);
        serializeVector(this.args, serializer);
    }
    static deserialize(deserializer) {
        const code = deserializer.deserializeBytes();
        const ty_args = deserializeVector(deserializer, TypeTag);
        const args = deserializeVector(deserializer, TransactionArgument);
        return new Script(code, ty_args, args);
    }
}
export class EntryFunction {
    module_name;
    function_name;
    ty_args;
    args;
    /**
     * Contains the payload to run a function within a module.
     * @param module_name Fully qualified module name. ModuleId consists of account address and module name.
     * @param function_name The function to run.
     * @param ty_args Type arguments that move function requires.
     *
     * @example
     * A coin transfer function has one type argument "CoinType".
     * ```
     * public(script) fun transfer<CoinType>(from: &signer, to: address, amount: u64,)
     * ```
     * @param args Arugments to the move function.
     *
     * @example
     * A coin transfer function has three arugments "from", "to" and "amount".
     * ```
     * public(script) fun transfer<CoinType>(from: &signer, to: address, amount: u64,)
     * ```
     */
    constructor(module_name, function_name, ty_args, args) {
        this.module_name = module_name;
        this.function_name = function_name;
        this.ty_args = ty_args;
        this.args = args;
    }
    /**
     *
     * @param module Fully qualified module name in format "AccountAddress::module_name" e.g. "0x1::coin"
     * @param func Function name
     * @param ty_args Type arguments that move function requires.
     *
     * @example
     * A coin transfer function has one type argument "CoinType".
     * ```
     * public(script) fun transfer<CoinType>(from: &signer, to: address, amount: u64,)
     * ```
     * @param args Arugments to the move function.
     *
     * @example
     * A coin transfer function has three arugments "from", "to" and "amount".
     * ```
     * public(script) fun transfer<CoinType>(from: &signer, to: address, amount: u64,)
     * ```
     * @returns
     */
    static natural(module, func, ty_args, args) {
        return new EntryFunction(ModuleId.fromStr(module), new Identifier(func), ty_args, args);
    }
    /**
     * `natual` is deprecated, please use `natural`
     *
     * @deprecated.
     */
    static natual(module, func, ty_args, args) {
        return EntryFunction.natural(module, func, ty_args, args);
    }
    serialize(serializer) {
        this.module_name.serialize(serializer);
        this.function_name.serialize(serializer);
        serializeVector(this.ty_args, serializer);
        serializer.serializeU32AsUleb128(this.args.length);
        this.args.forEach((item) => {
            serializer.serializeBytes(item);
        });
    }
    static deserialize(deserializer) {
        const module_name = ModuleId.deserialize(deserializer);
        const function_name = Identifier.deserialize(deserializer);
        const ty_args = deserializeVector(deserializer, TypeTag);
        const length = deserializer.deserializeUleb128AsU32();
        const list = [];
        for (let i = 0; i < length; i += 1) {
            list.push(deserializer.deserializeBytes());
        }
        const args = list;
        return new EntryFunction(module_name, function_name, ty_args, args);
    }
}
export class Module {
    code;
    /**
     * Contains the bytecode of a Move module that can be published to the Aptos chain.
     * @param code Move bytecode of a module.
     */
    constructor(code) {
        this.code = code;
    }
    serialize(serializer) {
        serializer.serializeBytes(this.code);
    }
    static deserialize(deserializer) {
        const code = deserializer.deserializeBytes();
        return new Module(code);
    }
}
export class ModuleId {
    address;
    name;
    /**
     * Full name of a module.
     * @param address The account address.
     * @param name The name of the module under the account at "address".
     */
    constructor(address, name) {
        this.address = address;
        this.name = name;
    }
    /**
     * Converts a string literal to a ModuleId
     * @param moduleId String literal in format "AccountAddress::module_name",
     *   e.g. "0x1::coin"
     * @returns
     */
    static fromStr(moduleId) {
        const parts = moduleId.split("::");
        if (parts.length !== 2) {
            throw new Error("Invalid module id.");
        }
        return new ModuleId(AccountAddress.fromHex(new HexString(parts[0])), new Identifier(parts[1]));
    }
    serialize(serializer) {
        this.address.serialize(serializer);
        this.name.serialize(serializer);
    }
    static deserialize(deserializer) {
        const address = AccountAddress.deserialize(deserializer);
        const name = Identifier.deserialize(deserializer);
        return new ModuleId(address, name);
    }
}
export class ChangeSet {
    serialize(serializer) {
        throw new Error("Not implemented.");
    }
    static deserialize(deserializer) {
        throw new Error("Not implemented.");
    }
}
export class WriteSet {
    serialize(serializer) {
        throw new Error("Not implmented.");
    }
    static deserialize(deserializer) {
        throw new Error("Not implmented.");
    }
}
export class SignedTransaction {
    raw_txn;
    authenticator;
    /**
     * A SignedTransaction consists of a raw transaction and an authenticator. The authenticator
     * contains a client's public key and the signature of the raw transaction.
     *
     * @see {@link https://aptos.dev/guides/creating-a-signed-transaction/ | Creating a Signed Transaction}
     *
     * @param raw_txn
     * @param authenticator Contains a client's public key and the signature of the raw transaction.
     *   Authenticator has 3 flavors: single signature, multi-signature and multi-agent.
     *   @see authenticator.ts for details.
     */
    constructor(raw_txn, authenticator) {
        this.raw_txn = raw_txn;
        this.authenticator = authenticator;
    }
    serialize(serializer) {
        this.raw_txn.serialize(serializer);
        this.authenticator.serialize(serializer);
    }
    static deserialize(deserializer) {
        const raw_txn = RawTransaction.deserialize(deserializer);
        const authenticator = TransactionAuthenticator.deserialize(deserializer);
        return new SignedTransaction(raw_txn, authenticator);
    }
}
export class RawTransactionWithData {
    static deserialize(deserializer) {
        const index = deserializer.deserializeUleb128AsU32();
        switch (index) {
            case 0:
                return MultiAgentRawTransaction.load(deserializer);
            default:
                throw new Error(`Unknown variant index for RawTransactionWithData: ${index}`);
        }
    }
}
export class MultiAgentRawTransaction extends RawTransactionWithData {
    raw_txn;
    secondary_signer_addresses;
    constructor(raw_txn, secondary_signer_addresses) {
        super();
        this.raw_txn = raw_txn;
        this.secondary_signer_addresses = secondary_signer_addresses;
    }
    serialize(serializer) {
        // enum variant index
        serializer.serializeU32AsUleb128(0);
        this.raw_txn.serialize(serializer);
        serializeVector(this.secondary_signer_addresses, serializer);
    }
    static load(deserializer) {
        const rawTxn = RawTransaction.deserialize(deserializer);
        const secondarySignerAddresses = deserializeVector(deserializer, AccountAddress);
        return new MultiAgentRawTransaction(rawTxn, secondarySignerAddresses);
    }
}
export class TransactionPayload {
    static deserialize(deserializer) {
        const index = deserializer.deserializeUleb128AsU32();
        switch (index) {
            case 0:
                return TransactionPayloadScript.load(deserializer);
            // TODO: change to 1 once ModuleBundle has been removed from rust
            case 2:
                return TransactionPayloadEntryFunction.load(deserializer);
            default:
                throw new Error(`Unknown variant index for TransactionPayload: ${index}`);
        }
    }
}
export class TransactionPayloadScript extends TransactionPayload {
    value;
    constructor(value) {
        super();
        this.value = value;
    }
    serialize(serializer) {
        serializer.serializeU32AsUleb128(0);
        this.value.serialize(serializer);
    }
    static load(deserializer) {
        const value = Script.deserialize(deserializer);
        return new TransactionPayloadScript(value);
    }
}
export class TransactionPayloadEntryFunction extends TransactionPayload {
    value;
    constructor(value) {
        super();
        this.value = value;
    }
    serialize(serializer) {
        serializer.serializeU32AsUleb128(2);
        this.value.serialize(serializer);
    }
    static load(deserializer) {
        const value = EntryFunction.deserialize(deserializer);
        return new TransactionPayloadEntryFunction(value);
    }
}
export class ChainId {
    value;
    constructor(value) {
        this.value = value;
    }
    serialize(serializer) {
        serializer.serializeU8(this.value);
    }
    static deserialize(deserializer) {
        const value = deserializer.deserializeU8();
        return new ChainId(value);
    }
}
export class TransactionArgument {
    static deserialize(deserializer) {
        const index = deserializer.deserializeUleb128AsU32();
        switch (index) {
            case 0:
                return TransactionArgumentU8.load(deserializer);
            case 1:
                return TransactionArgumentU64.load(deserializer);
            case 2:
                return TransactionArgumentU128.load(deserializer);
            case 3:
                return TransactionArgumentAddress.load(deserializer);
            case 4:
                return TransactionArgumentU8Vector.load(deserializer);
            case 5:
                return TransactionArgumentBool.load(deserializer);
            default:
                throw new Error(`Unknown variant index for TransactionArgument: ${index}`);
        }
    }
}
export class TransactionArgumentU8 extends TransactionArgument {
    value;
    constructor(value) {
        super();
        this.value = value;
    }
    serialize(serializer) {
        serializer.serializeU32AsUleb128(0);
        serializer.serializeU8(this.value);
    }
    static load(deserializer) {
        const value = deserializer.deserializeU8();
        return new TransactionArgumentU8(value);
    }
}
export class TransactionArgumentU64 extends TransactionArgument {
    value;
    constructor(value) {
        super();
        this.value = value;
    }
    serialize(serializer) {
        serializer.serializeU32AsUleb128(1);
        serializer.serializeU64(this.value);
    }
    static load(deserializer) {
        const value = deserializer.deserializeU64();
        return new TransactionArgumentU64(value);
    }
}
export class TransactionArgumentU128 extends TransactionArgument {
    value;
    constructor(value) {
        super();
        this.value = value;
    }
    serialize(serializer) {
        serializer.serializeU32AsUleb128(2);
        serializer.serializeU128(this.value);
    }
    static load(deserializer) {
        const value = deserializer.deserializeU128();
        return new TransactionArgumentU128(value);
    }
}
export class TransactionArgumentAddress extends TransactionArgument {
    value;
    constructor(value) {
        super();
        this.value = value;
    }
    serialize(serializer) {
        serializer.serializeU32AsUleb128(3);
        this.value.serialize(serializer);
    }
    static load(deserializer) {
        const value = AccountAddress.deserialize(deserializer);
        return new TransactionArgumentAddress(value);
    }
}
export class TransactionArgumentU8Vector extends TransactionArgument {
    value;
    constructor(value) {
        super();
        this.value = value;
    }
    serialize(serializer) {
        serializer.serializeU32AsUleb128(4);
        serializer.serializeBytes(this.value);
    }
    static load(deserializer) {
        const value = deserializer.deserializeBytes();
        return new TransactionArgumentU8Vector(value);
    }
}
export class TransactionArgumentBool extends TransactionArgument {
    value;
    constructor(value) {
        super();
        this.value = value;
    }
    serialize(serializer) {
        serializer.serializeU32AsUleb128(5);
        serializer.serializeBool(this.value);
    }
    static load(deserializer) {
        const value = deserializer.deserializeBool();
        return new TransactionArgumentBool(value);
    }
}
export class Transaction {
    getHashSalt() {
        const hash = sha3Hash.create();
        hash.update("APTOS::Transaction");
        return hash.digest();
    }
    static deserialize(deserializer) {
        const index = deserializer.deserializeUleb128AsU32();
        switch (index) {
            case 0:
                return UserTransaction.load(deserializer);
            default:
                throw new Error(`Unknown variant index for Transaction: ${index}`);
        }
    }
}
export class UserTransaction extends Transaction {
    value;
    constructor(value) {
        super();
        this.value = value;
    }
    hash() {
        const hash = sha3Hash.create();
        hash.update(this.getHashSalt());
        hash.update(bcsToBytes(this));
        return hash.digest();
    }
    serialize(serializer) {
        serializer.serializeU32AsUleb128(0);
        this.value.serialize(serializer);
    }
    static load(deserializer) {
        return new UserTransaction(SignedTransaction.deserialize(deserializer));
    }
}
