/**
 * ADMIN LOGIN CREDENTIALS & ROLES
 * Change these before publishing your website.
 *
 * Roles:
 *   super      — Full access (backup, reset, all panels)
 *   content    — Website content & SEO only
 *   membership — Applications, contact, certificates, subscribers
 */
window.RC_ADMIN_CONFIG = {
  sessionHours: 8,
  users: [
    {
      username: 'admin',
      email: 'admin@rcinnovation.club',
      password: 'rcinnovation2026',
      role: 'super',
      displayName: 'Super Admin'
    },
    {
      username: 'editor',
      email: 'editor@rcinnovation.club',
      password: 'rceditor2026',
      role: 'content',
      displayName: 'Content Editor'
    },
    {
      username: 'membership',
      email: 'membership@rcinnovation.club',
      password: 'rcmember2026',
      role: 'membership',
      displayName: 'Membership Manager'
    }
  ]
};
