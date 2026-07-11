export const NoPermissionsScreen = () => (
  <div
    style={{
      marginTop: '60px',
      textAlign: 'center',
      padding: '40px 24px',
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-md)',
      color: 'var(--text-primary)',
      maxWidth: '500px',
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
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
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
        stroke="var(--danger)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    </div>
    <h2
      style={{
        fontSize: '1.6rem',
        fontWeight: 600,
        margin: '0 0 10px',
        color: 'var(--text-primary)',
      }}
    >
      Access Denied
    </h2>
    <p style={{ margin: '0 0 8px', color: 'var(--text-secondary)' }}>
      You do not have permissions to access this screen.
    </p>
    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
      Please contact the system administrator if you believe this is an error.
    </p>
  </div>
);
