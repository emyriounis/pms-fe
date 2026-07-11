import { useState, useEffect } from 'react';
import { fetcher } from '../lib/fetcher';
import { Tenant } from '../utils/types/tenant';
import './SuperAdminScreen.css';

export const SuperAdminScreen = () => {
  // Tenant states
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal & Form states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [companyName, setCompanyName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Notification states
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Load tenants from the API
  const loadTenants = async (isRefetch = false) => {
    if (!isRefetch) {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await fetcher<any>('/tenants');
      // Defensive parsing to support both direct arrays and wrapped responses
      const tenantList = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.tenants)
            ? response.tenants
            : [];

      // Sort tenants by createdAt descending
      tenantList.sort((a: Tenant, b: Tenant) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setTenants(tenantList);
    } catch (err: any) {
      console.error('Failed to load tenants:', err);
      setError(
        err?.info?.message || err?.message || 'Failed to retrieve tenants. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  // Handle temporary notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Handle tenant registration submit
  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = companyName.trim();
    if (!trimmedName) {
      setFormError('Company name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await fetcher<Tenant>('/tenants', {
        method: 'POST',
        body: JSON.stringify({ companyName: trimmedName }),
      });

      // Show success notification
      setNotification({
        message: `Tenant "${trimmedName}" created successfully!`,
        type: 'success',
      });

      // Reset form and close modal
      setCompanyName('');
      setIsModalOpen(false);

      // Reload tenants list
      loadTenants(true);
    } catch (err: any) {
      console.error('Failed to create tenant:', err);
      setFormError(
        err?.info?.message || err?.message || 'Failed to create tenant. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (_) {
      return 'N/A';
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-title-group">
          <h2>Super Admin Dashboard</h2>
          <p>Register, monitor, and manage client tenants on the system.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginRight: '2px' }}
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Tenant
        </button>
      </div>

      {notification && (
        <div className={`notification-banner ${notification.type}`}>
          {notification.type === 'success' ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
          {notification.message}
        </div>
      )}

      {error && (
        <div className="notification-banner error">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div style={{ flex: 1 }}>{error}</div>
          <button
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            onClick={() => loadTenants()}
          >
            Retry
          </button>
        </div>
      )}

      <div className="dashboard-card">
        <div className="table-wrapper">
          <table className="tenant-table">
            <thead>
              <tr>
                <th>Tenant ID</th>
                <th>Company Name</th>
                <th>Created At</th>
                <th>Updated At</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // Skeleton Rows
                Array.from({ length: 3 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`}>
                    <td>
                      <div className="skeleton-line" style={{ width: '180px' }} />
                    </td>
                    <td>
                      <div className="skeleton-line" style={{ width: '120px' }} />
                    </td>
                    <td>
                      <div className="skeleton-line" style={{ width: '140px' }} />
                    </td>
                    <td>
                      <div className="skeleton-line" style={{ width: '140px' }} />
                    </td>
                  </tr>
                ))
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="empty-state">
                      <svg
                        className="empty-state-icon"
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                      <h3>No tenants found</h3>
                      <p>Get started by clicking the "New Tenant" button above.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                tenants.map((tenant) => (
                  <tr key={tenant.id}>
                    <td>
                      <span className="tenant-id-badge" title={tenant.id}>
                        {tenant.id}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{tenant.companyName}</td>
                    <td className="tenant-date">{formatDate(tenant.createdAt)}</td>
                    <td className="tenant-date">{formatDate(tenant.updatedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Tenant Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Register New Tenant</h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                aria-label="Close modal"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateTenant}>
              <div className="modal-body">
                {formError && (
                  <div
                    className="notification-banner error"
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {formError}
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="companyName">Company Name</label>
                  <input
                    type="text"
                    id="companyName"
                    className="form-control"
                    placeholder="e.g. Acme Corporation"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    disabled={isSubmitting}
                    autoFocus
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
