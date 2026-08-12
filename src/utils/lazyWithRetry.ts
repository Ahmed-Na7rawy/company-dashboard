import React from 'react';

export function lazyWithRetry(componentImport: () => Promise<{ default: React.ComponentType<any> }>) {
  return React.lazy(async () => {
    const pageHasBeenRefreshed = window.sessionStorage.getItem('page-has-been-refreshed');
    try {
      const module = await componentImport();
      window.sessionStorage.setItem('page-has-been-refreshed', 'false');
      return module;
    } catch (error) {
      if (pageHasBeenRefreshed !== 'true') {
        window.sessionStorage.setItem('page-has-been-refreshed', 'true');
        window.location.reload();
      }
      throw error;
    }
  });
}
