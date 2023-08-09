import path from 'path';

export function isExcludeVendor(file: string, excludeVendors: string[]) {
  for (const v of excludeVendors) {
    const vendorPrefixed = path.join('vendor', v);
    if (file.startsWith(vendorPrefixed)) {
      return true;
    }
  }

  return false;
}
