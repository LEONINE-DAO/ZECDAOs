pub mod contract;
pub mod state;

use cosmwasm_std::{entry_point, DepsMut, Env, MessageInfo, Response, StdResult};
use contract::{ExecuteMsg, InstantiateMsg, QueryMsg};

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> StdResult<Response> {
    contract::instantiate(deps, env, info, msg)
}

#[entry_point]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> StdResult<Response> {
    contract::execute(deps, env, info, msg)
}

#[entry_point]
pub fn query(deps: cosmwasm_std::Deps, env: Env, msg: QueryMsg) -> StdResult<cosmwasm_std::Binary> {
    contract::query(deps, env, msg)
}
