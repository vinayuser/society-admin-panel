import React from 'react';

/**
 * Consistent page header with optional subtitle and actions.
 */
const PageHeader = ({ title, subtitle, action }) => (
  <div className={`page-header ${action ? 'd-flex justify-content-between align-items-start flex-wrap gap-3' : ''}`}>
    <div>
      <h1>{title}</h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </div>
);

export default PageHeader;
