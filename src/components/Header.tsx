interface HeaderProps {
  user: any;
  signOut?: () => void;
}

export const Header = ({ user, signOut }: HeaderProps) => {
  const initial = user?.username?.[0]?.toUpperCase() || 'U';

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 28px',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        color: 'var(--text-primary)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            color: '#ffffff',
            boxShadow: '0 0 12px rgba(99, 102, 241, 0.4)',
          }}
        >
          P
        </div>
        <span style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '0.03em' }}>
          PMS Portal
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
              }}
            >
              {initial}
            </div>
            <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
              Hello {user.username}
            </span>
          </div>
        )}

        {signOut && (
          <button
            onClick={signOut}
            className="btn btn-secondary"
            style={{
              padding: '6px 14px',
              fontSize: '0.85rem',
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign out
          </button>
        )}
      </div>
    </header>
  );
};
