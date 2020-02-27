import { BigInt, Address } from "@graphprotocol/graph-ts";
import {
  Contract,
  NewLock,
  NewTokenURI,
  NewGlobalTokenSymbol,
  OwnershipTransferred,
  CreateLockCall
} from "../generated/Contract/Contract";
import { UnlockEntity, Lock } from "../generated/schema";
import { PublicLock as PublicLockTemplate } from "../generated/templates";
import { PublicLock } from "../generated/templates/PublicLock/PublicLock";

export function handleNewLock(event: NewLock): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  let entityId = event.transaction.hash.toHex();
  let entity = UnlockEntity.load(entityId);

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  if (entity == null) {
    entity = new UnlockEntity(entityId);

    // Entity fields can be set using simple assignments
    entity.count = BigInt.fromI32(0);
  }

  // BigInt and BigDecimal math are supported
  entity.count = entity.count + BigInt.fromI32(1);

  // Entity fields can be set based on event parameters
  entity.lockOwner = event.params.lockOwner;
  entity.newLockAddress = event.params.newLockAddress;

  PublicLockTemplate.create(event.params.newLockAddress);

  let chainPublicLock = PublicLock.bind(event.params.newLockAddress);
  entity.save();

  let lock = new Lock(event.params.newLockAddress.toHex());
  lock.address = event.params.newLockAddress;
  lock.price = chainPublicLock.keyPrice();
  lock.expirationDuration = chainPublicLock.expirationDuration();
  lock.maxNumberOfKeys = chainPublicLock.maxNumberOfKeys();
  lock.owner = chainPublicLock.owner();
  lock.creationBlock = event.block.number;
  let tokenAddress = chainPublicLock.try_tokenAddress();

  // if (event.block.number > BigInt.fromI32(4519015)) {
    // let tokenAddress = chainPublicLock.try_tokenAddress();

    if (!tokenAddress.reverted) {
      lock.tokenAddress = tokenAddress.value;
    } else {
      lock.tokenAddress = Address.fromString(
        "0000000000000000000000000000000000000000"
      );
    }

    let tokenName = chainPublicLock.try_name();
    if (!tokenName.reverted) {
      lock.name = tokenName.value;
    } else {
      lock.name = "";
    }

    let totalSupply = chainPublicLock.try_totalSupply();
    if (!totalSupply.reverted) {
      lock.totalSupply = totalSupply.value;
    }
  // } else {
    // lock.version = BigInt.fromI32(0);
  // }

  lock.save();
}

export function handleNewTokenURI(event: NewTokenURI): void {}

export function handleNewGlobalTokenSymbol(event: NewGlobalTokenSymbol): void {}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}

export function handleCreateLock(call: CreateLockCall): void {
  let entityId = call.transaction.hash.toHex();
  let entity = UnlockEntity.load(entityId);

  if (entity == null) {
    entity = new UnlockEntity(entityId);
  }

  let tokenAddress = call.inputs._tokenAddress.toHex();
  entity.save();
}
