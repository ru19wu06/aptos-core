// Copyright (c) Aptos
// SPDX-License-Identifier: Apache-2.0
import { HexString } from "./hex_string";
import { TransactionBuilder, TransactionBuilderABI, TxnBuilderTypes } from "./transaction_builder";
import { MAX_U64_BIG_INT } from "./bcs/consts";
import { TOKEN_ABIS, TOKEN_TRANSFER_OPT_IN } from "./abis";
import { bcsToBytes } from "./bcs";
import { getPropertyValueRaw } from "./utils/property_map_serializer";
import { Script, TransactionArgumentAddress, TransactionArgumentU64, TransactionArgumentU8Vector, TransactionPayloadScript, } from "./aptos_types";
/**
 * Class for creating, minting and managing minting NFT collections and tokens
 */
export class TokenClient {
    aptosClient;
    transactionBuilder;
    /**
     * Creates new TokenClient instance
     *
     * @param aptosClient AptosClient instance
     */
    constructor(aptosClient) {
        this.aptosClient = aptosClient;
        this.transactionBuilder = new TransactionBuilderABI(TOKEN_ABIS.map((abi) => new HexString(abi).toUint8Array()));
    }
    /**
     * Creates a new NFT collection within the specified account
     *
     * @param account AptosAccount where collection will be created
     * @param name Collection name
     * @param description Collection description
     * @param uri URL to additional info about collection
     * @param maxAmount Maximum number of `token_data` allowed within this collection
     * @returns The hash of the transaction submitted to the API
     */
    // :!:>createCollection
    async createCollection(account, name, description, uri, maxAmount = MAX_U64_BIG_INT, extraArgs) {
        // <:!:createCollection
        const payload = this.transactionBuilder.buildTransactionPayload("0x3::token::create_collection_script", [], [name, description, uri, maxAmount, [false, false, false]]);
        return this.aptosClient.generateSignSubmitTransaction(account, payload, extraArgs);
    }
    /**
     * Creates a new NFT within the specified account
     *
     * @param account AptosAccount where token will be created
     * @param collectionName Name of collection, that token belongs to
     * @param name Token name
     * @param description Token description
     * @param supply Token supply
     * @param uri URL to additional info about token
     * @param max The maxium of tokens can be minted from this token
     * @param royalty_payee_address the address to receive the royalty, the address can be a shared account address.
     * @param royalty_points_denominator the denominator for calculating royalty
     * @param royalty_points_numerator the numerator for calculating royalty
     * @param property_keys the property keys for storing on-chain properties
     * @param property_values the property values to be stored on-chain
     * @param property_types the type of property values
     * @returns The hash of the transaction submitted to the API
     */
    // :!:>createToken
    async createToken(account, collectionName, name, description, supply, uri, max = MAX_U64_BIG_INT, royalty_payee_address = account.address(), royalty_points_denominator = 0, royalty_points_numerator = 0, property_keys = [], property_values = [], property_types = [], extraArgs) {
        // <:!:createToken
        const payload = this.transactionBuilder.buildTransactionPayload("0x3::token::create_token_script", [], [
            collectionName,
            name,
            description,
            supply,
            max,
            uri,
            royalty_payee_address,
            royalty_points_denominator,
            royalty_points_numerator,
            [false, false, false, false, false],
            property_keys,
            getPropertyValueRaw(property_values, property_types),
            property_types,
        ]);
        return this.aptosClient.generateSignSubmitTransaction(account, payload, extraArgs);
    }
    /**
     * Creates a new NFT within the specified account
     *
     * @param account AptosAccount where token will be created
     * @param collectionName Name of collection, that token belongs to
     * @param name Token name
     * @param description Token description
     * @param supply Token supply
     * @param uri URL to additional info about token
     * @param max The maxium of tokens can be minted from this token
     * @param royalty_payee_address the address to receive the royalty, the address can be a shared account address.
     * @param royalty_points_denominator the denominator for calculating royalty
     * @param royalty_points_numerator the numerator for calculating royalty
     * @param property_keys the property keys for storing on-chain properties
     * @param property_values the property values to be stored on-chain
     * @param property_types the type of property values
     * @param mutability_config configs which field is mutable
     * @returns The hash of the transaction submitted to the API
     */
    // :!:>createToken
    async createTokenWithMutabilityConfig(account, collectionName, name, description, supply, uri, max = MAX_U64_BIG_INT, royalty_payee_address = account.address(), royalty_points_denominator = 0, royalty_points_numerator = 0, property_keys = [], property_values = [], property_types = [], mutability_config = [false, false, false, false, false], extraArgs) {
        // <:!:createToken
        const payload = this.transactionBuilder.buildTransactionPayload("0x3::token::create_token_script", [], [
            collectionName,
            name,
            description,
            supply,
            max,
            uri,
            royalty_payee_address,
            royalty_points_denominator,
            royalty_points_numerator,
            mutability_config,
            property_keys,
            property_values,
            property_types,
        ]);
        return this.aptosClient.generateSignSubmitTransaction(account, payload, extraArgs);
    }
    /**
     * Transfers specified amount of tokens from account to receiver
     *
     * @param account AptosAccount where token from which tokens will be transfered
     * @param receiver  Hex-encoded 32 byte Aptos account address to which tokens will be transfered
     * @param creator Hex-encoded 32 byte Aptos account address to which created tokens
     * @param collectionName Name of collection where token is stored
     * @param name Token name
     * @param amount Amount of tokens which will be transfered
     * @param property_version the version of token PropertyMap with a default value 0.
     * @returns The hash of the transaction submitted to the API
     */
    async offerToken(account, receiver, creator, collectionName, name, amount, property_version = 0, extraArgs) {
        const payload = this.transactionBuilder.buildTransactionPayload("0x3::token_transfers::offer_script", [], [receiver, creator, collectionName, name, property_version, amount]);
        return this.aptosClient.generateSignSubmitTransaction(account, payload, extraArgs);
    }
    /**
     * Claims a token on specified account
     *
     * @param account AptosAccount which will claim token
     * @param sender Hex-encoded 32 byte Aptos account address which holds a token
     * @param creator Hex-encoded 32 byte Aptos account address which created a token
     * @param collectionName Name of collection where token is stored
     * @param name Token name
     * @param property_version the version of token PropertyMap with a default value 0.
     * @returns The hash of the transaction submitted to the API
     */
    async claimToken(account, sender, creator, collectionName, name, property_version = 0, extraArgs) {
        const payload = this.transactionBuilder.buildTransactionPayload("0x3::token_transfers::claim_script", [], [sender, creator, collectionName, name, property_version]);
        return this.aptosClient.generateSignSubmitTransaction(account, payload, extraArgs);
    }
    /**
     * Removes a token from pending claims list
     *
     * @param account AptosAccount which will remove token from pending list
     * @param receiver Hex-encoded 32 byte Aptos account address which had to claim token
     * @param creator Hex-encoded 32 byte Aptos account address which created a token
     * @param collectionName Name of collection where token is strored
     * @param name Token name
     * @param property_version the version of token PropertyMap with a default value 0.
     * @returns The hash of the transaction submitted to the API
     */
    async cancelTokenOffer(account, receiver, creator, collectionName, name, property_version = 0, extraArgs) {
        const payload = this.transactionBuilder.buildTransactionPayload("0x3::token_transfers::cancel_offer_script", [], [receiver, creator, collectionName, name, property_version]);
        return this.aptosClient.generateSignSubmitTransaction(account, payload, extraArgs);
    }
    /**
     * Directly transfer the specified amount of tokens from account to receiver
     * using a single multi signature transaction.
     *
     * @param sender AptosAccount where token from which tokens will be transfered
     * @param receiver Hex-encoded 32 byte Aptos account address to which tokens will be transfered
     * @param creator Hex-encoded 32 byte Aptos account address to which created tokens
     * @param collectionName Name of collection where token is stored
     * @param name Token name
     * @param amount Amount of tokens which will be transfered
     * @param property_version the version of token PropertyMap with a default value 0.
     * @returns The hash of the transaction submitted to the API
     */
    async directTransferToken(sender, receiver, creator, collectionName, name, amount, propertyVersion = 0, extraArgs) {
        const payload = this.transactionBuilder.buildTransactionPayload("0x3::token::direct_transfer_script", [], [creator, collectionName, name, propertyVersion, amount]);
        const rawTxn = await this.aptosClient.generateRawTransaction(sender.address(), payload, extraArgs);
        const multiAgentTxn = new TxnBuilderTypes.MultiAgentRawTransaction(rawTxn, [
            TxnBuilderTypes.AccountAddress.fromHex(receiver.address()),
        ]);
        const senderSignature = new TxnBuilderTypes.Ed25519Signature(sender.signBuffer(TransactionBuilder.getSigningMessage(multiAgentTxn)).toUint8Array());
        const senderAuthenticator = new TxnBuilderTypes.AccountAuthenticatorEd25519(new TxnBuilderTypes.Ed25519PublicKey(sender.signingKey.publicKey), senderSignature);
        const receiverSignature = new TxnBuilderTypes.Ed25519Signature(receiver.signBuffer(TransactionBuilder.getSigningMessage(multiAgentTxn)).toUint8Array());
        const receiverAuthenticator = new TxnBuilderTypes.AccountAuthenticatorEd25519(new TxnBuilderTypes.Ed25519PublicKey(receiver.signingKey.publicKey), receiverSignature);
        const multiAgentAuthenticator = new TxnBuilderTypes.TransactionAuthenticatorMultiAgent(senderAuthenticator, [TxnBuilderTypes.AccountAddress.fromHex(receiver.address())], // Secondary signer addresses
        [receiverAuthenticator]);
        const bcsTxn = bcsToBytes(new TxnBuilderTypes.SignedTransaction(rawTxn, multiAgentAuthenticator));
        const transactionRes = await this.aptosClient.submitSignedBCSTransaction(bcsTxn);
        return transactionRes.hash;
    }
    /**
     * User opt-in or out direct transfer through a boolean flag
     *
     * @param sender AptosAccount where the token will be transferred
     * @param optIn boolean value indicates user want to opt-in or out of direct transfer
     * @returns The hash of the transaction submitted to the API
     */
    async optInTokenTransfer(sender, optIn) {
        const payload = this.transactionBuilder.buildTransactionPayload("0x3::token::opt_in_direct_transfer", [], [optIn]);
        return this.aptosClient.generateSignSubmitTransaction(sender, payload);
    }
    /**
     * Directly transfer token to a receiver. The receiver should have opted in to direct transfer
     *
     * @param sender AptosAccount where the token will be transferred
     * @param creator  address of the token creator
     * @param collectionName Name of collection where token is stored
     * @param name Token name
     * @param property_version the version of token PropertyMap
     * @param amount Amount of tokens which will be transfered
     * @returns The hash of the transaction submitted to the API
     */
    async transferWithOptIn(sender, creator, collectionName, tokenName, propertyVersion, receiver, amount) {
        // compile script to invoke public transfer function
        const payload = new TransactionPayloadScript(new Script(new HexString(TOKEN_TRANSFER_OPT_IN).toUint8Array(), [], [
            new TransactionArgumentAddress(TxnBuilderTypes.AccountAddress.fromHex(creator)),
            new TransactionArgumentU8Vector(new TextEncoder().encode(collectionName)),
            new TransactionArgumentU8Vector(new TextEncoder().encode(tokenName)),
            new TransactionArgumentU64(BigInt(propertyVersion)),
            new TransactionArgumentAddress(TxnBuilderTypes.AccountAddress.fromHex(receiver)),
            new TransactionArgumentU64(BigInt(amount)),
        ]));
        return this.aptosClient.generateSignSubmitTransaction(sender, payload);
    }
    /**
     * BurnToken by Creator
     *
     * @param creator creator of the token
     * @param ownerAddress address of the token owner
     * @param collectionName Name of collection where token is stored
     * @param name Token name
     * @param amount Amount of tokens which will be transfered
     * @param property_version the version of token PropertyMap
     * @returns The hash of the transaction submitted to the API
     */
    async burnByCreator(creator, ownerAddress, collection, name, PropertyVersion, amount) {
        const payload = this.transactionBuilder.buildTransactionPayload("0x3::token::burn_by_creator", [], [ownerAddress, collection, name, PropertyVersion, amount]);
        return this.aptosClient.generateSignSubmitTransaction(creator, payload);
    }
    /**
     * BurnToken by Owner
     *
     * @param owner creator of the token
     * @param creatorAddress address of the token creator
     * @param collectionName Name of collection where token is stored
     * @param name Token name
     * @param amount Amount of tokens which will be transfered
     * @param property_version the version of token PropertyMap
     * @returns The hash of the transaction submitted to the API
     */
    async burnByOwner(owner, creatorAddress, collection, name, PropertyVersion, amount) {
        const payload = this.transactionBuilder.buildTransactionPayload("0x3::token::burn", [], [creatorAddress, collection, name, PropertyVersion, amount]);
        return this.aptosClient.generateSignSubmitTransaction(owner, payload);
    }
    /**
     * creator mutates the properties of the tokens
     *
     * @param account AptosAccount who modifies the token properties
     * @param tokenOwner the address of account owning the token
     * @param creator the creator of the token
     * @param collection_name the name of the token collection
     * @param tokenName the name of created token
     * @param propertyVersion the property_version of the token to be modified
     * @param amount the number of tokens to be modified
     *
     * @returns The hash of the transaction submitted to the API
     */
    async mutateTokenProperties(account, tokenOwner, creator, collection_name, tokenName, propertyVersion, amount, keys, values, types) {
        const payload = this.transactionBuilder.buildTransactionPayload("0x3::token::mutate_token_properties", [], [tokenOwner, creator, collection_name, tokenName, propertyVersion, amount, keys, values, types]);
        return this.aptosClient.generateSignSubmitTransaction(account, payload);
    }
    /**
     * Queries collection data
     * @param creator Hex-encoded 32 byte Aptos account address which created a collection
     * @param collectionName Collection name
     * @returns Collection data in below format
     * ```
     *  Collection {
     *    // Describes the collection
     *    description: string,
     *    // Unique name within this creators account for this collection
     *    name: string,
     *    // URL for additional information/media
     *    uri: string,
     *    // Total number of distinct Tokens tracked by the collection
     *    count: number,
     *    // Optional maximum number of tokens allowed within this collections
     *    maximum: number
     *  }
     * ```
     */
    async getCollectionData(creator, collectionName) {
        const resources = await this.aptosClient.getAccountResources(creator);
        const accountResource = resources.find((r) => r.type === "0x3::token::Collections");
        const { handle } = accountResource.data.collection_data;
        const getCollectionTableItemRequest = {
            key_type: "0x1::string::String",
            value_type: "0x3::token::CollectionData",
            key: collectionName,
        };
        const collectionTable = await this.aptosClient.getTableItem(handle, getCollectionTableItemRequest);
        return collectionTable;
    }
    /**
     * Queries token data from collection
     *
     * @param creator Hex-encoded 32 byte Aptos account address which created a token
     * @param collectionName Name of collection, which holds a token
     * @param tokenName Token name
     * @returns Token data in below format
     * ```
     * TokenData {
     *     // Unique name within this creators account for this Token's collection
     *     collection: string;
     *     // Describes this Token
     *     description: string;
     *     // The name of this Token
     *     name: string;
     *     // Optional maximum number of this type of Token.
     *     maximum: number;
     *     // Total number of this type of Token
     *     supply: number;
     *     /// URL for additional information / media
     *     uri: string;
     *   }
     * ```
     */
    // :!:>getTokenData
    async getTokenData(creator, collectionName, tokenName) {
        const creatorHex = creator instanceof HexString ? creator.hex() : creator;
        const collection = await this.aptosClient.getAccountResource(creatorHex, "0x3::token::Collections");
        const { handle } = collection.data.token_data;
        const tokenDataId = {
            creator: creatorHex,
            collection: collectionName,
            name: tokenName,
        };
        const getTokenTableItemRequest = {
            key_type: "0x3::token::TokenDataId",
            value_type: "0x3::token::TokenData",
            key: tokenDataId,
        };
        // We know the response will be a struct containing TokenData, hence the
        // implicit cast.
        return this.aptosClient.getTableItem(handle, getTokenTableItemRequest);
    } // <:!:getTokenData
    /**
     * Queries token balance for the token creator
     */
    async getToken(creator, collectionName, tokenName, property_version = "0") {
        const tokenDataId = {
            creator: creator instanceof HexString ? creator.hex() : creator,
            collection: collectionName,
            name: tokenName,
        };
        return this.getTokenForAccount(creator, {
            token_data_id: tokenDataId,
            property_version,
        });
    }
    /**
     * Queries token balance for a token account
     * @param account Hex-encoded 32 byte Aptos account address which created a token
     * @param tokenId token id
     *
     * TODO: Update this:
     * @example
     * ```
     * {
     *   creator: '0x1',
     *   collection: 'Some collection',
     *   name: 'Awesome token'
     * }
     * ```
     * @returns Token object in below format
     * ```
     * Token {
     *   id: TokenId;
     *   value: number;
     * }
     * ```
     */
    async getTokenForAccount(account, tokenId) {
        const tokenStore = await this.aptosClient.getAccountResource(account instanceof HexString ? account.hex() : account, "0x3::token::TokenStore");
        const { handle } = tokenStore.data.tokens;
        const getTokenTableItemRequest = {
            key_type: "0x3::token::TokenId",
            value_type: "0x3::token::Token",
            key: tokenId,
        };
        try {
            return await this.aptosClient.getTableItem(handle, getTokenTableItemRequest);
        }
        catch (error) {
            if (error?.status === 404) {
                return {
                    id: tokenId,
                    amount: "0",
                    token_properties: {},
                };
            }
            return error;
        }
    }
}
