import React from "react";

interface PageHeaderProps {
  title: string;
  breadcrumbs: { label: string; href?: string; icon?: React.ReactNode }[];
  children?: React.ReactNode; // For right-side controls
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, breadcrumbs, children }) => (
  <div className="flex flex-col gap-2 border-b border-gray-200 bg-white px-6 pt-4 pb-2 rounded-t-lg">
    <nav className="flex items-center text-sm text-gray-500 space-x-2">
      {breadcrumbs.map((crumb, idx) => (
        <span key={idx} className="flex items-center">
          {crumb.icon && <span className="mr-1">{crumb.icon}</span>}
          {crumb.href ? (
            <a href={crumb.href} className="hover:underline">{crumb.label}</a>
          ) : (
            <span>{crumb.label}</span>
          )}
          {idx < breadcrumbs.length - 1 && <span className="mx-2">{'>'}</span>}
        </span>
      ))}
    </nav>
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  </div>
);

export default PageHeader; 