// Constants for the AOS Studio backend
// Status enums for lead pipeline

module.exports = {
  // Verification step statuses
  VERIFICATION_STATUS: {
    PENDING: 'pending',
    SENT: 'sent',
    VERIFIED: 'verified',
    FAILED: 'failed'
  },

  // CompScrap step statuses
  COMP_SCRAP_STATUS: {
    PENDING: 'pending',
    SENT: 'sent',
    SCRAPED: 'scraped',
    FAILED: 'failed'
  },

  // Box1 step statuses
  BOX1_STATUS: {
    PENDING: 'pending',
    SENT: 'sent',
    FIT: 'fit',
    DROP: 'drop',
    NO_FIT: 'no_fit',
    HIT: 'hit',
    FAILED: 'failed'
  },

  // Instantly step statuses
  INSTANTLY_STATUS: {
    PENDING: 'pending',
    SENT: 'sent',
    REPLIED: 'replied',
    POSITIVE_REPLY: 'positive_reply',
    CONVERTED: 'converted',
    BOUNCED: 'bounced'
  },

  // Pagination defaults
  DEFAULT_PAGE_SIZE: 25,
  MAX_PAGE_SIZE: 100,

  // Campaign statuses
  CAMPAIGN_STATUS: {
    ACTIVE: 'active',
    PAUSED: 'paused',
    COMPLETED: 'completed'
  }
};
