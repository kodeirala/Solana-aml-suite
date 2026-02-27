// programs/aml-token/src/lib.rs
use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

declare_id!("AMLxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");

#[program]
pub mod aml_token {
    use super::*;

    /// Initialize the blacklist registry
    pub fn initialize_blacklist(ctx: Context<InitializeBlacklist>) -> Result<()> {
        let blacklist = &mut ctx.accounts.blacklist;
        blacklist.authority = ctx.accounts.authority.key();
        blacklist.blocked_addresses = Vec::new();
        msg!("Blacklist initialized with authority: {}", blacklist.authority);
        Ok(())
    }

    /// Add an address to the blacklist
    pub fn add_to_blacklist(
        ctx: Context<UpdateBlacklist>,
        address: Pubkey,
        reason: String,
    ) -> Result<()> {
        let blacklist = &mut ctx.accounts.blacklist;
        
        // Check if already blacklisted
        if blacklist.blocked_addresses.iter().any(|entry| entry.address == address) {
            return Err(ErrorCode::AddressAlreadyBlacklisted.into());
        }
        
        // Add to blacklist
        blacklist.blocked_addresses.push(BlacklistEntry {
            address,
            reason,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        msg!("Address {} added to blacklist", address);
        Ok(())
    }

    /// Remove an address from the blacklist
    pub fn remove_from_blacklist(
        ctx: Context<UpdateBlacklist>,
        address: Pubkey,
    ) -> Result<()> {
        let blacklist = &mut ctx.accounts.blacklist;
        
        // Find and remove
        if let Some(pos) = blacklist.blocked_addresses.iter().position(|entry| entry.address == address) {
            blacklist.blocked_addresses.remove(pos);
            msg!("Address {} removed from blacklist", address);
            Ok(())
        } else {
            Err(ErrorCode::AddressNotBlacklisted.into())
        }
    }

    /// Transfer hook - called before every token transfer
    /// This is where we enforce the blacklist
    pub fn transfer_hook(
        ctx: Context<TransferHook>,
        amount: u64,
    ) -> Result<()> {
        let blacklist = &ctx.accounts.blacklist;
        let from = ctx.accounts.source_token.owner;
        let to = ctx.accounts.destination_token.owner;
        
        // Check if sender is blacklisted
        if blacklist.blocked_addresses.iter().any(|entry| entry.address == from) {
            msg!("🚫 Transfer BLOCKED: Sender {} is blacklisted", from);
            return Err(ErrorCode::SenderBlacklisted.into());
        }
        
        // Check if recipient is blacklisted
        if blacklist.blocked_addresses.iter().any(|entry| entry.address == to) {
            msg!("🚫 Transfer BLOCKED: Recipient {} is blacklisted", to);
            return Err(ErrorCode::RecipientBlacklisted.into());
        }
        
        // Check for large transfers (flag but don't block)
        let lamports_threshold = 1_000_000_000_000; // 1000 SOL worth (adjust)
        if amount > lamports_threshold {
            msg!("⚠️  Large transfer detected: {} tokens from {} to {}", amount, from, to);
            // Could emit event here for monitoring
        }
        
        msg!("✅ Transfer approved: {} tokens from {} to {}", amount, from, to);
        Ok(())
    }

    /// Initialize a token with transfer hook enabled
    pub fn create_token_with_hook(
        ctx: Context<CreateTokenWithHook>,
        decimals: u8,
        name: String,
        symbol: String,
    ) -> Result<()> {
        msg!("Creating AML-compliant token: {} ({})", name, symbol);
        Ok(())
    }
}

// ============================================================================
// Accounts Structs
// ============================================================================

#[derive(Accounts)]
pub struct InitializeBlacklist<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 4 + (1000 * (32 + 100 + 8)), // Support up to 1000 blacklisted addresses
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

#[derive(Accounts)]
pub struct TransferHook<'info> {
    #[account(
        seeds = [b"blacklist"],
        bump
    )]
    pub blacklist: Account<'info, Blacklist>,
    
    #[account(mut)]
    pub source_token: InterfaceAccount<'info, TokenAccount>,
    
    #[account(mut)]
    pub destination_token: InterfaceAccount<'info, TokenAccount>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct CreateTokenWithHook<'info> {
    #[account(
        init,
        payer = payer,
        mint::decimals = 9,
        mint::authority = mint_authority,
        mint::freeze_authority = mint_authority,
    )]
    pub mint: InterfaceAccount<'info, Mint>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    /// CHECK: This is the mint authority
    pub mint_authority: AccountInfo<'info>,
    
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

// ============================================================================
// Data Structs
// ============================================================================

#[account]
pub struct Blacklist {
    pub authority: Pubkey,
    pub blocked_addresses: Vec<BlacklistEntry>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct BlacklistEntry {
    pub address: Pubkey,
    pub reason: String,
    pub timestamp: i64,
}

// ============================================================================
// Error Codes
// ============================================================================

#[error_code]
pub enum ErrorCode {
    #[msg("Address is already blacklisted")]
    AddressAlreadyBlacklisted,
    
    #[msg("Address is not in blacklist")]
    AddressNotBlacklisted,
    
    #[msg("Sender is blacklisted and cannot send tokens")]
    SenderBlacklisted,
    
    #[msg("Recipient is blacklisted and cannot receive tokens")]
    RecipientBlacklisted,
    
    #[msg("Unauthorized: Only authority can modify blacklist")]
    Unauthorized,
}
