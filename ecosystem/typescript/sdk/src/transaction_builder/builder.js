// Copyright (c) Aptos
// SPDX-License-Identifier: Apache-2.0
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { sha3_256 as sha3Hash } from "@noble/hashes/sha3";
import { Ed25519PublicKey, RawTransaction, SignedTransaction, TransactionAuthenticatorEd25519, TransactionAuthenticatorMultiEd25519, MultiAgentRawTransaction, AccountAddress, EntryFunction, Identifier, ChainId, Script, TransactionPayloadEntryFunction, TransactionPayloadScript, ModuleId, } from "../aptos_types";
import { bcsToBytes, Deserializer, Serializer } from "../bcs";
import { ArgumentABI, EntryFunctionABI, ScriptABI, TransactionScriptABI, TypeArgumentABI } from "../aptos_types/abi";
import { HexString } from "../hex_string";
import { argToTransactionArgument, TypeTagParser, serializeArg } from "./builder_utils";
import { DEFAULT_TXN_EXP_SEC_FROM_NOW, DEFAULT_MAX_GAS_AMOUNT, MemoizeExpiring } from "../utils";
export { TypeTagParser } from "./builder_utils";
const RAW_TRANSACTION_SALT = "APTOS::RawTransaction";
const RAW_TRANSACTION_WITH_DATA_SALT = "APTOS::RawTransactionWithData";
export class TransactionBuilder {
    rawTxnBuilder;
    signingFunction;
    constructor(signingFunction, rawTxnBuilder) {
        this.rawTxnBuilder = rawTxnBuilder;
        this.signingFunction = signingFunction;
    }
    /**
     * Builds a RawTransaction. Relays the call to TransactionBuilderABI.build
     * @param func
     * @param ty_tags
     * @param args
     */
    build(func, ty_tags, args) {
        if (!this.rawTxnBuilder) {
            throw new Error("this.rawTxnBuilder doesn't exist.");
        }
        return this.rawTxnBuilder.build(func, ty_tags, args);
    }
    /** Generates a Signing Message out of a raw transaction. */
    static getSigningMessage(rawTxn) {
        const hash = sha3Hash.create();
        if (rawTxn instanceof RawTransaction) {
            hash.update(RAW_TRANSACTION_SALT);
        }
        else if (rawTxn instanceof MultiAgentRawTransaction) {
            hash.update(RAW_TRANSACTION_WITH_DATA_SALT);
        }
        else {
            throw new Error("Unknown transaction type.");
        }
        const prefix = hash.digest();
        const body = bcsToBytes(rawTxn);
        const mergedArray = new Uint8Array(prefix.length + body.length);
        mergedArray.set(prefix);
        mergedArray.set(body, prefix.length);
        return mergedArray;
    }
}
/**
 * Provides signing method for signing a raw transaction with single public key.
 */
export class TransactionBuilderEd25519 extends TransactionBuilder {
    publicKey;
    constructor(signingFunction, publicKey, rawTxnBuilder) {
        super(signingFunction, rawTxnBuilder);
        this.publicKey = publicKey;
    }
    rawToSigned(rawTxn) {
        const signingMessage = TransactionBuilder.getSigningMessage(rawTxn);
        const signature = this.signingFunction(signingMessage);
        const authenticator = new TransactionAuthenticatorEd25519(new Ed25519PublicKey(this.publicKey), signature);
        return new SignedTransaction(rawTxn, authenticator);
    }
    /** Signs a raw transaction and returns a bcs serialized transaction. */
    sign(rawTxn) {
        return bcsToBytes(this.rawToSigned(rawTxn));
    }
}
/**
 * Provides signing method for signing a raw transaction with multisig public key.
 */
export class TransactionBuilderMultiEd25519 extends TransactionBuilder {
    publicKey;
    constructor(signingFunction, publicKey) {
        super(signingFunction);
        this.publicKey = publicKey;
    }
    rawToSigned(rawTxn) {
        const signingMessage = TransactionBuilder.getSigningMessage(rawTxn);
        const signature = this.signingFunction(signingMessage);
        const authenticator = new TransactionAuthenticatorMultiEd25519(this.publicKey, signature);
        return new SignedTransaction(rawTxn, authenticator);
    }
    /** Signs a raw transaction and returns a bcs serialized transaction. */
    sign(rawTxn) {
        return bcsToBytes(this.rawToSigned(rawTxn));
    }
}
/**
 * Builds raw transactions based on ABI
 */
export class TransactionBuilderABI {
    abiMap;
    builderConfig;
    /**
     * Constructs a TransactionBuilderABI instance
     * @param abis List of binary ABIs.
     * @param builderConfig Configs for creating a raw transaction.
     */
    constructor(abis, builderConfig) {
        this.abiMap = new Map();
        abis.forEach((abi) => {
            const deserializer = new Deserializer(abi);
            const scriptABI = ScriptABI.deserialize(deserializer);
            let k;
            if (scriptABI instanceof EntryFunctionABI) {
                const funcABI = scriptABI;
                const { address: addr, name: moduleName } = funcABI.module_name;
                k = `${HexString.fromUint8Array(addr.address).toShortString()}::${moduleName.value}::${funcABI.name}`;
            }
            else {
                const funcABI = scriptABI;
                k = funcABI.name;
            }
            if (this.abiMap.has(k)) {
                throw new Error("Found conflicting ABI interfaces");
            }
            this.abiMap.set(k, scriptABI);
        });
        this.builderConfig = {
            maxGasAmount: BigInt(DEFAULT_MAX_GAS_AMOUNT),
            expSecFromNow: DEFAULT_TXN_EXP_SEC_FROM_NOW,
            ...builderConfig,
        };
    }
    static toBCSArgs(abiArgs, args) {
        if (abiArgs.length !== args.length) {
            throw new Error("Wrong number of args provided.");
        }
        return args.map((arg, i) => {
            const serializer = new Serializer();
            serializeArg(arg, abiArgs[i].type_tag, serializer);
            return serializer.getBytes();
        });
    }
    static toTransactionArguments(abiArgs, args) {
        if (abiArgs.length !== args.length) {
            throw new Error("Wrong number of args provided.");
        }
        return args.map((arg, i) => argToTransactionArgument(arg, abiArgs[i].type_tag));
    }
    setSequenceNumber(seqNumber) {
        this.builderConfig.sequenceNumber = BigInt(seqNumber);
    }
    /**
     * Builds a TransactionPayload. For dApps, chain ID and account sequence numbers are only known to the wallet.
     * Instead of building a RawTransaction (requires chainID and sequenceNumber), dApps can build a TransactionPayload
     * and pass the payload to the wallet for signing and sending.
     * @param func Fully qualified func names, e.g. 0x1::Coin::transfer
     * @param ty_tags TypeTag strings
     * @param args Function arguments
     * @returns TransactionPayload
     */
    buildTransactionPayload(func, ty_tags, args) {
        const typeTags = ty_tags.map((ty_arg) => new TypeTagParser(ty_arg).parseTypeTag());
        let payload;
        if (!this.abiMap.has(func)) {
            throw new Error(`Cannot find function: ${func}`);
        }
        const scriptABI = this.abiMap.get(func);
        if (scriptABI instanceof EntryFunctionABI) {
            const funcABI = scriptABI;
            const bcsArgs = TransactionBuilderABI.toBCSArgs(funcABI.args, args);
            payload = new TransactionPayloadEntryFunction(new EntryFunction(funcABI.module_name, new Identifier(funcABI.name), typeTags, bcsArgs));
        }
        else if (scriptABI instanceof TransactionScriptABI) {
            const funcABI = scriptABI;
            const scriptArgs = TransactionBuilderABI.toTransactionArguments(funcABI.args, args);
            payload = new TransactionPayloadScript(new Script(funcABI.code, typeTags, scriptArgs));
        }
        else {
            /* istanbul ignore next */
            throw new Error("Unknown ABI format.");
        }
        return payload;
    }
    /**
     * Builds a RawTransaction
     * @param func Fully qualified func names, e.g. 0x1::Coin::transfer
     * @param ty_tags TypeTag strings.
     * @example Below are valid value examples
     * ```
     * // Structs are in format `AccountAddress::ModuleName::StructName`
     * 0x1::aptos_coin::AptosCoin
     * // Vectors are in format `vector<other_tag_string>`
     * vector<0x1::aptos_coin::AptosCoin>
     * bool
     * u8
     * u64
     * u128
     * address
     * ```
     * @param args Function arguments
     * @returns RawTransaction
     */
    build(func, ty_tags, args) {
        const { sender, sequenceNumber, gasUnitPrice, maxGasAmount, expSecFromNow, chainId } = this.builderConfig;
        if (!gasUnitPrice) {
            throw new Error("No gasUnitPrice provided.");
        }
        const senderAccount = sender instanceof AccountAddress ? sender : AccountAddress.fromHex(sender);
        const expTimestampSec = BigInt(Math.floor(Date.now() / 1000) + Number(expSecFromNow));
        const payload = this.buildTransactionPayload(func, ty_tags, args);
        if (payload) {
            return new RawTransaction(senderAccount, BigInt(sequenceNumber), payload, BigInt(maxGasAmount), BigInt(gasUnitPrice), expTimestampSec, new ChainId(Number(chainId)));
        }
        throw new Error("Invalid ABI.");
    }
}
/**
 * This transaction builder downloads JSON ABIs from the fullnodes.
 * It then translates the JSON ABIs to the format that is accepted by TransactionBuilderABI
 */
export class TransactionBuilderRemoteABI {
    aptosClient;
    builderConfig;
    // We don't want the builder to depend on the actual AptosClient. There might be circular dependencies.
    constructor(aptosClient, builderConfig) {
        this.aptosClient = aptosClient;
        this.builderConfig = builderConfig;
    }
    // Cache for 10 minutes
    async fetchABI(addr) {
        const modules = await this.aptosClient.getAccountModules(addr);
        const abis = modules
            .map((module) => module.abi)
            .flatMap((abi) => abi.exposed_functions
            .filter((ef) => ef.is_entry)
            .map((ef) => ({
            fullName: `${abi.address}::${abi.name}::${ef.name}`,
            ...ef,
        })));
        const abiMap = new Map();
        abis.forEach((abi) => {
            abiMap.set(abi.fullName, abi);
        });
        return abiMap;
    }
    /**
     * Builds a raw transaction. Only support script function a.k.a entry function payloads
     *
     * @param func fully qualified function name in format <address>::<module>::<function>, e.g. 0x1::coins::transfer
     * @param ty_tags
     * @param args
     * @returns RawTransaction
     */
    async build(func, ty_tags, args) {
        /* eslint no-param-reassign: ["off"] */
        const normlize = (s) => s.replace(/^0[xX]0*/g, "0x");
        func = normlize(func);
        const funcNameParts = func.split("::");
        if (funcNameParts.length !== 3) {
            throw new Error(
            // eslint-disable-next-line max-len
            "'func' needs to be a fully qualified function name in format <address>::<module>::<function>, e.g. 0x1::coins::transfer");
        }
        const [addr, module] = func.split("::");
        // Downloads the JSON abi
        const abiMap = await this.fetchABI(addr);
        if (!abiMap.has(func)) {
            throw new Error(`${func} doesn't exist.`);
        }
        const funcAbi = abiMap.get(func);
        // Remove all `signer` and `&signer` from argument list because the Move VM injects those arguments. Clients do not
        // need to care about those args. `signer` and `&signer` are required be in the front of the argument list. But we
        // just loop through all arguments and filter out `signer` and `&signer`.
        const originalArgs = funcAbi.params.filter((param) => param !== "signer" && param !== "&signer");
        // Convert string arguments to TypeArgumentABI
        const typeArgABIs = originalArgs.map((arg, i) => new ArgumentABI(`var${i}`, new TypeTagParser(arg).parseTypeTag()));
        const entryFunctionABI = new EntryFunctionABI(funcAbi.name, ModuleId.fromStr(`${addr}::${module}`), "", // Doc string
        funcAbi.generic_type_params.map((_, i) => new TypeArgumentABI(`${i}`)), typeArgABIs);
        const { sender, ...rest } = this.builderConfig;
        const senderAddress = sender instanceof AccountAddress ? HexString.fromUint8Array(sender.address) : sender;
        const [{ sequence_number: sequenceNumber }, chainId, { gas_estimate: gasUnitPrice }] = await Promise.all([
            rest?.sequenceNumber
                ? Promise.resolve({ sequence_number: rest?.sequenceNumber })
                : this.aptosClient.getAccount(senderAddress),
            rest?.chainId ? Promise.resolve(rest?.chainId) : this.aptosClient.getChainId(),
            rest?.gasUnitPrice ? Promise.resolve({ gas_estimate: rest?.gasUnitPrice }) : this.aptosClient.estimateGasPrice(),
        ]);
        const builderABI = new TransactionBuilderABI([bcsToBytes(entryFunctionABI)], {
            sender,
            sequenceNumber,
            chainId,
            gasUnitPrice: BigInt(gasUnitPrice),
            ...rest,
        });
        return builderABI.build(func, ty_tags, args);
    }
}
__decorate([
    MemoizeExpiring(10 * 60 * 1000)
], TransactionBuilderRemoteABI.prototype, "fetchABI", null);
