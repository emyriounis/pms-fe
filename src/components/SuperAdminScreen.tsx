import React, { useState, useEffect } from 'react';
import { fetcher } from '../lib/fetcher';
import { Tenant } from '../utils/types/tenant';
import { Hotel } from '../utils/types/hotel';
import './SuperAdminScreen.css';

export const SuperAdminScreen = () => {
  // Tenant states
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Expanded tenant IDs tracking
  const [expandedTenants, setExpandedTenants] = useState<Record<string, boolean>>({});
  const [hotelsByTenant, setHotelsByTenant] = useState<Record<string, Hotel[]>>({});
  const [hotelsLoading, setHotelsLoading] = useState<Record<string, boolean>>({});
  const [hotelsError, setHotelsError] = useState<Record<string, string | null>>({});

  // Register Tenant Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [companyName, setCompanyName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Register Hotel Modal states
  const [isHotelModalOpen, setIsHotelModalOpen] = useState<boolean>(false);
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
  const [activeTenantName, setActiveTenantName] = useState<string>('');
  const [hotelName, setHotelName] = useState<string>('');
  const [isCreatingHotel, setIsCreatingHotel] = useState<boolean>(false);
  const [hotelFormError, setHotelFormError] = useState<string | null>(null);

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

  // Load hotels for a specific tenant
  const loadHotels = async (tenantId: string) => {
    setHotelsLoading((prev) => ({ ...prev, [tenantId]: true }));
    setHotelsError((prev) => ({ ...prev, [tenantId]: null }));

    try {
      const response = await fetcher<any>(`/tenants/${tenantId}/hotels`);
      const hotelsList = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.hotels)
            ? response.hotels
            : [];

      // Sort hotels by name ascending
      hotelsList.sort((a: Hotel, b: Hotel) => a.name.localeCompare(b.name));

      setHotelsByTenant((prev) => ({ ...prev, [tenantId]: hotelsList }));
    } catch (err: any) {
      console.error(`Failed to load hotels for tenant ${tenantId}:`, err);
      setHotelsError((prev) => ({
        ...prev,
        [tenantId]: err?.info?.message || err?.message || 'Failed to retrieve hotels.',
      }));
    } finally {
      setHotelsLoading((prev) => ({ ...prev, [tenantId]: false }));
    }
  };

  // Toggle tenant expansion
  const toggleTenant = async (tenantId: string) => {
    const isCurrentlyExpanded = !!expandedTenants[tenantId];
    setExpandedTenants((prev) => ({
      ...prev,
      [tenantId]: !isCurrentlyExpanded,
    }));

    if (!isCurrentlyExpanded) {
      await loadHotels(tenantId);
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

  // Handle hotel registration submit
  const handleCreateHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    setHotelFormError(null);

    const trimmedName = hotelName.trim();
    if (!trimmedName) {
      setHotelFormError('Hotel name is required.');
      return;
    }
    if (!activeTenantId) {
      setHotelFormError('No tenant context found.');
      return;
    }

    setIsCreatingHotel(true);
    try {
      await fetcher<Hotel>(`/tenants/${activeTenantId}/hotels`, {
        method: 'POST',
        body: JSON.stringify({ name: trimmedName }),
      });

      setNotification({
        message: `Hotel "${trimmedName}" registered successfully for ${activeTenantName}!`,
        type: 'success',
      });

      setHotelName('');
      setIsHotelModalOpen(false);

      // Reload hotels for this tenant
      await loadHotels(activeTenantId);
    } catch (err: any) {
      console.error('Failed to create hotel:', err);
      setHotelFormError(
        err?.info?.message || err?.message || 'Failed to register hotel. Please try again.',
      );
    } finally {
      setIsCreatingHotel(false);
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
                <th style={{ width: '48px' }}></th>
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
                      <div className="skeleton-line" style={{ width: '24px' }} />
                    </td>
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
                  <td colSpan={5}>
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
                tenants.map((tenant) => {
                  const isExpanded = !!expandedTenants[tenant.id];
                  return (
                    <React.Fragment key={tenant.id}>
                      <tr>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className={`expand-btn ${isExpanded ? 'expanded' : ''}`}
                            onClick={() => toggleTenant(tenant.id)}
                            aria-label={isExpanded ? 'Collapse' : 'Expand'}
                          >
                            <svg
                              className="expand-chevron"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </button>
                        </td>
                        <td>
                          <span className="tenant-id-badge" title={tenant.id}>
                            {tenant.id}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{tenant.companyName}</td>
                        <td className="tenant-date">{formatDate(tenant.createdAt)}</td>
                        <td className="tenant-date">{formatDate(tenant.updatedAt)}</td>
                      </tr>
                      {isExpanded && (
                        <tr className="nested-row">
                          <td colSpan={5}>
                            <div className="nested-hotels-container">
                              <div className="nested-hotels-header">
                                <h4>
                                  <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M3 21h18" />
                                    <path d="M9 21V9H5v12" />
                                    <path d="M19 21V5a2 2 0 0 0-2-2H7" />
                                    <path d="M14 7h1" />
                                    <path d="M14 11h1" />
                                    <path d="M14 15h1" />
                                  </svg>
                                  Hotels under {tenant.companyName}
                                </h4>
                                <button
                                  className="btn btn-secondary"
                                  style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                                  onClick={() => {
                                    setActiveTenantId(tenant.id);
                                    setActiveTenantName(tenant.companyName);
                                    setIsHotelModalOpen(true);
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
                                    style={{ marginRight: '2px' }}
                                  >
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                  </svg>
                                  Add Hotel
                                </button>
                              </div>

                              {hotelsLoading[tenant.id] ? (
                                <div
                                  className="nested-hotels-table-wrapper"
                                  style={{ padding: '16px' }}
                                >
                                  <div
                                    className="skeleton-line"
                                    style={{ width: '100%', marginBottom: '8px' }}
                                  />
                                  <div className="skeleton-line" style={{ width: '70%' }} />
                                </div>
                              ) : hotelsError[tenant.id] ? (
                                <div
                                  className="notification-banner error"
                                  style={{ margin: 0, padding: '10px 16px', fontSize: '0.88rem' }}
                                >
                                  <span>{hotelsError[tenant.id]}</span>
                                  <button
                                    className="btn btn-secondary"
                                    style={{
                                      padding: '4px 8px',
                                      fontSize: '0.75rem',
                                      marginLeft: 'auto',
                                    }}
                                    onClick={() => loadHotels(tenant.id)}
                                  >
                                    Retry
                                  </button>
                                </div>
                              ) : !hotelsByTenant[tenant.id] ||
                                hotelsByTenant[tenant.id].length === 0 ? (
                                <div className="nested-hotels-table-wrapper">
                                  <div className="nested-hotels-empty">
                                    No hotels registered for this tenant yet.
                                  </div>
                                </div>
                              ) : (
                                <div className="nested-hotels-table-wrapper">
                                  <table className="nested-hotels-table">
                                    <thead>
                                      <tr>
                                        <th>Hotel ID</th>
                                        <th>Hotel Name</th>
                                        <th>Created At</th>
                                        <th>Updated At</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {hotelsByTenant[tenant.id].map((hotel) => (
                                        <tr key={hotel.id}>
                                          <td>
                                            <span className="tenant-id-badge" title={hotel.id}>
                                              {hotel.id}
                                            </span>
                                          </td>
                                          <td style={{ fontWeight: 600 }}>{hotel.name}</td>
                                          <td className="tenant-date">
                                            {formatDate(hotel.createdAt)}
                                          </td>
                                          <td className="tenant-date">
                                            {formatDate(hotel.updatedAt)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
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

      {/* Register Hotel Modal */}
      {isHotelModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => !isCreatingHotel && setIsHotelModalOpen(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Hotel for {activeTenantName}</h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsHotelModalOpen(false)}
                disabled={isCreatingHotel}
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
            <form onSubmit={handleCreateHotel}>
              <div className="modal-body">
                {hotelFormError && (
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
                    {hotelFormError}
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="hotelName">Hotel Name</label>
                  <input
                    type="text"
                    id="hotelName"
                    className="form-control"
                    placeholder="e.g. Grand Resort & Spa"
                    value={hotelName}
                    onChange={(e) => setHotelName(e.target.value)}
                    disabled={isCreatingHotel}
                    autoFocus
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsHotelModalOpen(false)}
                  disabled={isCreatingHotel}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isCreatingHotel}>
                  {isCreatingHotel ? 'Adding...' : 'Add Hotel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
