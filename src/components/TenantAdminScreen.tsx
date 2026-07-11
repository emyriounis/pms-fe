export const TenantAdminScreen = () => (
  <div
    style={{
      marginTop: '60px',
      textAlign: 'center',
      padding: '45px 24px',
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-md)',
      color: 'var(--text-primary)',
      maxWidth: '600px',
      margin: '60px auto',
      border: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-lg)',
    }}
  >
    <div
      style={{
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        backgroundColor: 'var(--accent-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px',
      }}
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
    <h2 style={{ fontSize: '1.8rem', fontWeight: 600, margin: '0 0 10px' }}>
      Tenant Admin Dashboard
    </h2>
    <p style={{ color: 'var(--text-secondary)', margin: '0 0 20px' }}>Role: tenant_admin</p>
    <div
      style={{
        padding: '16px',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-color)',
        color: 'var(--text-muted)',
        fontSize: '0.95rem',
      }}
    >
      Tenant workspace initialization is in progress.
    </div>
  </div>
);
