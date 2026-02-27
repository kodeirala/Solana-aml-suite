use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod aml_token {
    use super::*;

    pub fn initialize_blacklist(ctx: Context<InitializeBlacklist>) -> Result<()> {
        let blacklist = &mut ctx.accounts.blacklist;
        blacklist.authority = ctx.accounts.authority.key();
        blacklist.blocked_count = 0;
        msg!("Blacklist initialized");
        Ok(())
    }

    pub fn add_to_blacklist(ctx: Context<UpdateBlacklist>, address: Pubkey) -> Result<()> {
        let blacklist = &mut ctx.accounts.blacklist;
        blacklist.blocked_count += 1;
        msg!("Address {} blacklisted", address);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeBlacklist<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 8,
        seeds = [b"blacklist"],
        bump
    )]
    pub blacklist: Account<'info, Blacklist>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateBlacklist<'info> {
    #[account(
        mut,
        seeds = [b"blacklist"],
        bump,
        has_one = authority
    )]
    pub blacklist: Account<'info, Blacklist>,
    
    pub authority: Signer<'info>,
}

#[account]
pub struct Blacklist {
    pub authority: Pubkey,
    pub blocked_count: u64,
}
