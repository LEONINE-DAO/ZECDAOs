use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Deps, DepsMut, Env, MessageInfo, Response, StdResult};

#[cw_serde]
pub struct InstantiateMsg {
    pub admin: String,
    pub platform_charter_version: String,
}

#[cw_serde]
pub enum ExecuteMsg {
    RegisterFund {
        fund_id: String,
        slug: String,
        constitution_hash: Option<String>,
        quorum_percent: u8,
        pass_threshold_percent: u8,
        voting_period_secs: u64,
        execution_delay_secs: u64,
    },
    RegisterMember {
        fund_id: String,
        member_commitment: String,
        role: String,
        voting_power: u32,
    },
    CreateProposal {
        fund_id: String,
        proposal_type: String,
        title_hash: String,
        payload_hash: String,
    },
    CastVote {
        proposal_id: u64,
        choice: VoteChoice,
        member_commitment: String,
    },
    FinalizeProposal {
        proposal_id: u64,
    },
    SetExecutionGate {
        proposal_id: u64,
        may_execute: bool,
    },
}

#[cw_serde]
pub enum VoteChoice {
    Yes,
    No,
    Abstain,
}

#[cw_serde]
pub enum QueryMsg {
    GetFund { fund_id: String },
    GetProposal { proposal_id: u64 },
    MayExecute { proposal_id: u64 },
}

#[cw_serde]
pub struct FundRecord {
    pub slug: String,
    pub constitution_hash: Option<String>,
    pub quorum_percent: u8,
    pub pass_threshold_percent: u8,
    pub voting_period_secs: u64,
    pub execution_delay_secs: u64,
}

#[cw_serde]
pub struct ProposalRecord {
    pub fund_id: String,
    pub proposal_type: String,
    pub status: String,
    pub yes: u32,
    pub no: u32,
    pub abstain: u32,
    pub may_execute: bool,
    pub closes_at: u64,
}

#[cw_serde]
pub struct FundResponse {
    pub fund: FundRecord,
}

#[cw_serde]
pub struct ProposalResponse {
    pub proposal: ProposalRecord,
}

#[cw_serde]
pub struct MayExecuteResponse {
    pub may_execute: bool,
}

pub fn instantiate(
    _deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: InstantiateMsg,
) -> StdResult<Response> {
    Ok(Response::new()
        .add_attribute("method", "instantiate")
        .add_attribute("admin", msg.admin)
        .add_attribute("charter", msg.platform_charter_version))
}

pub fn execute(
    deps: DepsMut,
    env: Env,
    _info: MessageInfo,
    msg: ExecuteMsg,
) -> StdResult<Response> {
    match msg {
        ExecuteMsg::RegisterFund {
            fund_id,
            slug,
            constitution_hash,
            quorum_percent,
            pass_threshold_percent,
            voting_period_secs,
            execution_delay_secs,
        } => {
            let fund = FundRecord {
                slug,
                constitution_hash,
                quorum_percent,
                pass_threshold_percent,
                voting_period_secs,
                execution_delay_secs,
            };
            crate::state::FUNDS.save(deps.storage, fund_id.clone(), &fund)?;
            Ok(Response::new()
                .add_attribute("action", "register_fund")
                .add_attribute("fund_id", fund_id))
        }
        ExecuteMsg::RegisterMember {
            fund_id,
            member_commitment,
            role,
            voting_power,
        } => {
            let key = (fund_id.clone(), member_commitment.clone());
            crate::state::MEMBERS.save(
                deps.storage,
                key,
                &(role, voting_power),
            )?;
            Ok(Response::new()
                .add_attribute("action", "register_member")
                .add_attribute("fund_id", fund_id))
        }
        ExecuteMsg::CreateProposal {
            fund_id,
            proposal_type,
            title_hash,
            payload_hash,
        } => {
            let id = crate::state::next_proposal_id(deps.storage)?;
            let fund = crate::state::FUNDS.load(deps.storage, fund_id.clone())?;
            let closes_at = env.block.time.seconds() + fund.voting_period_secs;
            let proposal = ProposalRecord {
                fund_id: fund_id.clone(),
                proposal_type,
                status: "active".to_string(),
                yes: 0,
                no: 0,
                abstain: 0,
                may_execute: false,
                closes_at,
            };
            crate::state::PROPOSALS.save(deps.storage, id, &proposal)?;
            crate::state::PROPOSAL_HASHES.save(deps.storage, id, &(title_hash, payload_hash))?;
            Ok(Response::new()
                .add_attribute("action", "create_proposal")
                .add_attribute("proposal_id", id.to_string()))
        }
        ExecuteMsg::CastVote {
            proposal_id,
            choice,
            member_commitment: _,
        } => {
            let mut proposal = crate::state::PROPOSALS.load(deps.storage, proposal_id)?;
            match choice {
                VoteChoice::Yes => proposal.yes += 1,
                VoteChoice::No => proposal.no += 1,
                VoteChoice::Abstain => proposal.abstain += 1,
            }
            crate::state::PROPOSALS.save(deps.storage, proposal_id, &proposal)?;
            Ok(Response::new()
                .add_attribute("action", "cast_vote")
                .add_attribute("proposal_id", proposal_id.to_string()))
        }
        ExecuteMsg::FinalizeProposal { proposal_id } => {
            let mut proposal = crate::state::PROPOSALS.load(deps.storage, proposal_id)?;
            let fund = crate::state::FUNDS.load(deps.storage, proposal.fund_id.clone())?;
            let participating = proposal.yes + proposal.no + proposal.abstain;
            let turnout = if participating > 0 {
                (participating as u128 * 100) / participating as u128
            } else {
                0
            };
            let denom = proposal.yes + proposal.no;
            let pass_ratio = if denom > 0 {
                (proposal.yes as u128 * 100) / denom as u128
            } else {
                0
            };
            let passed = turnout as u8 >= fund.quorum_percent
                && pass_ratio as u8 >= fund.pass_threshold_percent;
            proposal.status = if passed {
                "passed".to_string()
            } else {
                "rejected".to_string()
            };
            proposal.may_execute = passed;
            crate::state::PROPOSALS.save(deps.storage, proposal_id, &proposal)?;
            Ok(Response::new()
                .add_attribute("action", "finalize_proposal")
                .add_attribute("status", proposal.status))
        }
        ExecuteMsg::SetExecutionGate {
            proposal_id,
            may_execute,
        } => {
            let mut proposal = crate::state::PROPOSALS.load(deps.storage, proposal_id)?;
            proposal.may_execute = may_execute;
            crate::state::PROPOSALS.save(deps.storage, proposal_id, &proposal)?;
            Ok(Response::new()
                .add_attribute("action", "set_execution_gate")
                .add_attribute("may_execute", may_execute.to_string()))
        }
    }
}

pub fn query(deps: Deps, env: Env, msg: QueryMsg) -> StdResult<cosmwasm_std::Binary> {
    match msg {
        QueryMsg::GetFund { fund_id } => {
            let fund = crate::state::FUNDS.load(deps.storage, fund_id)?;
            cosmwasm_std::to_json_binary(&FundResponse { fund })
        }
        QueryMsg::GetProposal { proposal_id } => {
            let proposal = crate::state::PROPOSALS.load(deps.storage, proposal_id)?;
            cosmwasm_std::to_json_binary(&ProposalResponse { proposal })
        }
        QueryMsg::MayExecute { proposal_id } => {
            let proposal = crate::state::PROPOSALS.load(deps.storage, proposal_id)?;
            let fund = crate::state::FUNDS.load(deps.storage, proposal.fund_id)?;
            let timelock_ok =
                env.block.time.seconds() >= proposal.closes_at + fund.execution_delay_secs;
            cosmwasm_std::to_json_binary(&MayExecuteResponse {
                may_execute: proposal.may_execute && timelock_ok && proposal.status == "passed",
            })
        }
    }
}
