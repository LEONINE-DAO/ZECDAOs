use cosmwasm_std::Storage;
use cw_storage_plus::{Item, Map};

use crate::contract::{FundRecord, ProposalRecord};

pub const PROPOSAL_COUNTER: Item<u64> = Item::new("proposal_counter");
pub const FUNDS: Map<String, FundRecord> = Map::new("funds");
pub const MEMBERS: Map<(String, String), (String, u32)> = Map::new("members");
pub const PROPOSALS: Map<u64, ProposalRecord> = Map::new("proposals");
pub const PROPOSAL_HASHES: Map<u64, (String, String)> = Map::new("proposal_hashes");

pub fn next_proposal_id(store: &mut dyn Storage) -> cosmwasm_std::StdResult<u64> {
    let id = PROPOSAL_COUNTER.may_load(store)?.unwrap_or(0) + 1;
    PROPOSAL_COUNTER.save(store, &id)?;
    Ok(id)
}
