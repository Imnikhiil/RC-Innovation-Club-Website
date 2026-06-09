window.RC_ADMIN_ROLES = {
  ROLES: {
    super: {
      label: 'Super Admin',
      description: 'Full access to all website content, applications, and system settings.',
      panels: [
        'dashboard', 'hero', 'stats', 'about', 'events', 'faculty', 'core', 'ambassadors', 'members',
        'legacy', 'testimonials', 'partners', 'projects', 'resources', 'gallery', 'join',
        'membership', 'contact', 'certificates', 'newsletter', 'notifications', 'seo', 'analytics'
      ],
      actions: ['save', 'export', 'import', 'reset', 'clearAnalytics']
    },
    content: {
      label: 'Content Editor',
      description: 'Edit public website sections, media, and marketing content.',
      panels: [
        'dashboard', 'hero', 'stats', 'about', 'events', 'faculty', 'core', 'ambassadors', 'members',
        'legacy', 'testimonials', 'partners', 'projects', 'resources', 'gallery', 'join',
        'newsletter', 'seo'
      ],
      actions: ['save']
    },
    membership: {
      label: 'Membership Manager',
      description: 'Manage membership applications, contact messages, certificates, and subscribers.',
      panels: ['dashboard', 'membership', 'contact', 'certificates', 'newsletter', 'notifications'],
      actions: ['save']
    }
  },

  getRoleConfig(role) {
    return this.ROLES[role] || this.ROLES.super;
  },

  getRoleLabel(role) {
    return this.getRoleConfig(role).label;
  },

  canAccessPanel(role, panel) {
    const cfg = this.getRoleConfig(role);
    return cfg.panels.includes(panel);
  },

  canPerformAction(role, action) {
    const cfg = this.getRoleConfig(role);
    return cfg.actions.includes(action);
  },

  getDefaultPanel(role) {
    return this.getRoleConfig(role).panels[0] || 'dashboard';
  },

  getAccessiblePanels(role) {
    return [...this.getRoleConfig(role).panels];
  }
};
